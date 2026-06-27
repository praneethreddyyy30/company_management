import { Response } from "express";
import { LeaveRequest } from "../models/LeaveRequest";
import { Attendance } from "../models/Attendance";
import { Intern } from "../models/Intern";
import { User } from "../models/User";
import { AuthRequest } from "../middlewares/authMiddleware";
import { getNormalizedToday } from "./standupController";
import { createNotification } from "../services/notificationService";
import { io } from "../app";

// POST /api/leaves - Intern applies for leave
export const applyLeave = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type, fromDate, toDate, reason } = req.body;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role !== "Intern") {
    res.status(403).json({ message: "Access forbidden: only interns can request leaves." });
    return;
  }

  if (!type || !fromDate || !toDate || !reason) {
    res.status(400).json({ message: "Type, fromDate, toDate, and reason are required." });
    return;
  }

  if (reason.length < 5) {
    res.status(400).json({ message: "Reason must be at least 5 characters long." });
    return;
  }

  try {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const today = getNormalizedToday();

    // Leave must be requested at least one day before the start date
    const minStartDate = new Date(today);
    minStartDate.setDate(minStartDate.getDate() + 1); // today + 1 day

    if (from < minStartDate) {
      res.status(400).json({ message: "Leave must be requested at least one day before the start date." });
      return;
    }

    if (to < from) {
      res.status(400).json({ message: "End date (toDate) cannot be before start date (fromDate)." });
      return;
    }

    // Calculate days requested
    const diffMs = to.getTime() - from.getTime();
    const days = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1);

    const leave = new LeaveRequest({
      employeeId: req.user.id,
      employeeName: req.user.name,
      type,
      fromDate: from,
      toDate: to,
      days,
      reason,
      status: "Pending", // TitleCase standardized
      appliedAt: new Date(),
    });
    await leave.save();

    // Broadcast event
    io.emit("leave:requested", leave);

    // Notify the assigned Lead (mentor)
    const intern = await Intern.findOne({ userId: req.user.id });
    if (intern && intern.mentorId) {
      await createNotification(
        intern.mentorId,
        "Leave Request Submitted",
        `${req.user.name} requested ${days} day(s) of ${type} leave.`,
        "Leave",
        "warning"
      );
    } else {
      // If no mentor assigned, notify Admins
      const admins = await User.find({ role: "Admin" });
      for (const admin of admins) {
        await createNotification(
          admin._id,
          "Leave Request (Unassigned Intern)",
          `${req.user.name} requested leave, but holds no assigned mentor.`,
          "Leave",
          "warning"
        );
      }
    }

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// PUT /api/leaves/:id/status - Lead or Admin approves or rejects leave request
export const updateLeaveStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;
  const { status } = req.body; // Approved or Rejected

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role !== "Lead" && req.user.role !== "Admin") {
    res.status(403).json({ message: "Access forbidden: only Leads and Admins can process leave requests." });
    return;
  }

  if (!status || !["Approved", "Rejected"].includes(status)) {
    res.status(400).json({ message: "Status must be either 'Approved' or 'Rejected'." });
    return;
  }

  try {
    const leave = await LeaveRequest.findById(id);
    if (!leave) {
      res.status(404).json({ message: "Leave request not found." });
      return;
    }

    if (leave.status !== "Pending") {
      res.status(400).json({ message: `Leave request has already been processed: ${leave.status}` });
      return;
    }

    // Lead isolation check
    if (req.user.role === "Lead") {
      const intern = await Intern.findOne({ userId: leave.employeeId });
      if (!intern || !intern.mentorId || intern.mentorId.toString() !== req.user.id) {
        res.status(403).json({ message: "Access forbidden: you can only approve leaves for your assigned interns." });
        return;
      }
    }

    leave.status = status;
    leave.approvedBy = req.user.id as any;
    await leave.save();

    if (status === "Approved") {
      // 1. Automatically generate / upsert Attendance records as "Leave"
      const start = new Date(leave.fromDate);
      const end = new Date(leave.toDate);
      const current = new Date(start);

      while (current <= end) {
        await Attendance.findOneAndUpdate(
          { internId: leave.employeeId, date: new Date(current) },
          {
            status: "Leave",
            checkIn: new Date(current),
            checkOut: new Date(current),
            totalHours: 0,
          },
          { upsert: true, new: true }
        );
        current.setDate(current.getDate() + 1);
      }

      // 2. Set Intern profile status to "leave"
      await Intern.findOneAndUpdate(
        { userId: leave.employeeId },
        { status: "leave" }
      );

      // Emit socket event
      io.emit("leave:approved", leave);
    } else {
      io.emit("leave:rejected", leave);
    }

    // 3. Notify Intern cardholder
    await createNotification(
      leave.employeeId,
      `Leave Request ${status}`,
      `Your request for ${leave.days} day(s) of ${leave.type} leave has been ${status.toLowerCase()}.`,
      "Leave",
      status === "Approved" ? "success" : "error"
    );

    res.status(200).json(leave);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/leaves - List leaves (Leads view all; Interns view only theirs)
export const getAllLeaves = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    let query: any = {};

    // Interns: see their own leaves
    if (req.user.role === "Intern") {
      query.employeeId = req.user.id;
    }

    // Leads: see leaves of their assigned interns
    if (req.user.role === "Lead") {
      const myInterns = await Intern.find({ mentorId: req.user.id });
      const myInternUserIds = myInterns.map((i) => i.userId);
      query.employeeId = { $in: myInternUserIds };
    }

    const leaves = await LeaveRequest.find(query).sort({ fromDate: -1 });
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
