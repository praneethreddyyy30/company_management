import { Response } from "express";
import { Attendance } from "../models/Attendance";
import { Standup } from "../models/Standup";
import { Intern } from "../models/Intern";
import { AuthRequest } from "../middlewares/authMiddleware";
import { getNormalizedToday } from "./standupController";
import { createNotification } from "../services/notificationService";

// Helper to check if current time is late compared to WORK_START_TIME
const checkIsLate = (): boolean => {
  const tz = process.env.TIMEZONE || "Asia/Kolkata";
  const startTime = process.env.WORK_START_TIME || "10:00";
  
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  
  const timeString = formatter.format(now); // E.g., "10:15"
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [currentHour, currentMinute] = timeString.split(":").map(Number);
  
  return currentHour > startHour || (currentHour === startHour && currentMinute > startMinute);
};

// POST /api/attendance/check-in - Intern checks in
export const checkIn = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role !== "Intern" && req.user.role !== "Lead") {
    res.status(403).json({ message: "Access forbidden: only interns and leads mark attendance." });
    return;
  }

  try {
    const normalizedDate = getNormalizedToday();

    // Check if check-in already registered today
    const existing = await Attendance.findOne({ internId: req.user.id, date: normalizedDate });
    if (existing) {
      res.status(400).json({ message: "You have already checked in today." });
      return;
    }

    const isLate = checkIsLate();
    const status = isLate ? "Late" : "Present";

    const attendance = new Attendance({
      internId: req.user.id,
      date: normalizedDate,
      checkIn: new Date(),
      status,
      totalHours: 0,
    });
    await attendance.save();

    // Automatically check off attendanceMarked in onboarding checklist
    const intern = await Intern.findOne({ userId: req.user.id });
    if (intern) {
      if (intern.onboarding && intern.onboarding.checklist) {
        intern.onboarding.checklist.attendanceMarked = true;
        const checklistKeys = ["profileCompleted", "guideRead", "tasksReviewed", "standupSubmitted", "attendanceMarked"];
        const allDone = checklistKeys.every(k => (intern.onboarding.checklist as any)[k] === true);
        if (allDone) {
          intern.onboarding.completed = true;
        }
      }
      await intern.save();
    }

    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// POST /api/attendance/check-out - Intern checks out
export const checkOut = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role !== "Intern" && req.user.role !== "Lead") {
    res.status(403).json({ message: "Access forbidden: only interns and leads mark attendance." });
    return;
  }

  try {
    const normalizedDate = getNormalizedToday();
    const attendance = await Attendance.findOne({ internId: req.user.id, date: normalizedDate });

    if (!attendance) {
      res.status(400).json({ message: "No check-in record found for today. Please check in first." });
      return;
    }

    if (attendance.checkOut) {
      res.status(400).json({ message: "You have already checked out today." });
      return;
    }

    attendance.checkOut = new Date();
    // Calculate total hours worked
    const diffMs = attendance.checkOut.getTime() - attendance.checkIn.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    attendance.totalHours = parseFloat(diffHours.toFixed(2));
    
    await attendance.save();

    res.status(200).json(attendance);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/attendance/history - Get attendance logs
export const getAttendanceHistory = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  const { internId } = req.query;

  // Interns can only view their own history
  if (req.user.role === "Intern") {
    try {
      const logs = await Attendance.find({ internId: req.user.id }).sort({ date: -1 });
      res.status(200).json(logs);
      return;
    } catch (error) {
      res.status(500).json({ message: `Server error: ${(error as Error).message}` });
      return;
    }
  }

  // Leads can only see their assigned interns' logs
  try {
    const query: any = {};
    if (req.user.role === "Lead") {
      const myInterns = await Intern.find({ mentorId: req.user.id });
      const myInternUserIds = myInterns.map((i) => i.userId);
      
      if (internId) {
        if (!myInternUserIds.map((id) => id.toString()).includes(internId.toString())) {
          res.status(403).json({ message: "Access forbidden: you can only view attendance for your assigned interns." });
          return;
        }
        query.internId = internId;
      } else {
        query.internId = { $in: myInternUserIds };
      }
    } else {
      if (internId) query.internId = internId;
    }
    
    const logs = await Attendance.find(query)
      .populate("internId", "name email avatar")
      .sort({ date: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/attendance/heatmap - Get GitHub-style heatmap data matrix
export const getAttendanceHeatmap = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const grid = Array.from({ length: 5 }, () => Array(7).fill(0));
    
    // Query attendance checkins and standup submissions over the last 12 months
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

    const checkins = await Attendance.find({ checkIn: { $gte: twelveMonthsAgo } });
    const standups = await Standup.find({ createdAt: { $gte: twelveMonthsAgo } });

    // Aggregate actions by Day of Week (Cols 0-6: Mon-Sun) and Hour Block (Rows 0-4)
    const mapTimestampToGrid = (createdAt: Date) => {
      const day = createdAt.getDay();
      // Translate JS Day (0 is Sunday, 1 is Monday) to Mon-indexed (0 is Monday, 6 is Sunday)
      const dayOfWeek = day === 0 ? 6 : day - 1;
      
      const hour = createdAt.getHours();
      let hourRow = 4; // 6pm onwards
      
      if (hour >= 6 && hour < 9) hourRow = 0;       // 6am
      else if (hour >= 9 && hour < 12) hourRow = 1;  // 9am
      else if (hour >= 12 && hour < 15) hourRow = 2; // 12pm
      else if (hour >= 15 && hour < 18) hourRow = 3; // 3pm

      grid[hourRow][dayOfWeek] += 1;
    };

    checkins.forEach(c => mapTimestampToGrid(c.checkIn));
    standups.forEach(s => mapTimestampToGrid(s.createdAt));

    res.status(200).json(grid);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
export { checkIsLate };
