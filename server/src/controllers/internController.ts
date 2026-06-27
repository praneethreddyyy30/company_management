import { Response } from "express";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Intern } from "../models/Intern";
import { Batch } from "../models/Batch";
import { AuthRequest } from "../middlewares/authMiddleware";

// GET /api/interns
export const getAllInterns = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  // Interns can only view their own profile - they shouldn't view directory
  if (req.user.role === "Intern") {
    try {
      const intern = await Intern.findOne({ userId: req.user.id })
        .populate("userId", "-password")
        .populate("batchId");
      if (!intern) {
        res.status(404).json({ message: "Intern profile not found." });
        return;
      }
      res.status(200).json([intern]); // return as list for compatibility
      return;
    } catch (error) {
      res.status(500).json({ message: `Server error: ${(error as Error).message}` });
      return;
    }
  }

  const { batchId, track, status, q } = req.query;
  const filter: any = {};

  if (batchId) filter.batchId = batchId;
  if (track) filter.track = track;
  if (status) filter.status = status;

  // Data Isolation: Lead can only see their assigned interns
  if (req.user.role === "Lead") {
    filter.mentorId = req.user.id;
  }

  try {
    let interns = await Intern.find(filter)
      .populate("userId", "-password")
      .populate("batchId");

    // Filter by search query (name or email from populated User schema)
    if (q) {
      const queryStr = (q as string).toLowerCase();
      interns = interns.filter((intern: any) => {
        const user = intern.userId;
        return (
          user &&
          (user.name.toLowerCase().includes(queryStr) ||
            user.email.toLowerCase().includes(queryStr))
        );
      });
    }

    res.status(200).json(interns);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/interns/:id
export const getInternById = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    const intern = await Intern.findById(id)
      .populate("userId", "-password")
      .populate("batchId");
    if (!intern) {
      res.status(404).json({ message: "Intern not found." });
      return;
    }

    // Intern role: can only fetch their own profile
    if (req.user.role === "Intern" && intern.userId.toString() !== req.user.id) {
      res.status(403).json({ message: "Access forbidden: you can only view your own profile." });
      return;
    }

    // Lead role: can only fetch their assigned interns
    if (req.user.role === "Lead" && (!intern.mentorId || intern.mentorId.toString() !== req.user.id)) {
      res.status(403).json({ message: "Access forbidden: this intern is assigned to a different Lead." });
      return;
    }

    res.status(200).json(intern);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// POST /api/interns
export const createIntern = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  // Only Admins can create employees
  if (req.user.role !== "Admin") {
    res.status(403).json({ message: "Access forbidden: only Admin can add new employees." });
    return;
  }

  const { name, email, track, mentorId, batchId, startDate, endDate, avatar, status, department, employmentType } = req.body;

  if (!name || !email || !track || !batchId || !startDate || !endDate) {
    res.status(400).json({ message: "Name, email, track, batchId, startDate, and endDate are required." });
    return;
  }

  const normalizedEmail = email.trim().toLowerCase();

  try {
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(400).json({ message: "User with this email already exists." });
      return;
    }

    const batch = await Batch.findById(batchId);
    if (!batch) {
      res.status(404).json({ message: "Specified Batch not found." });
      return;
    }

    let mentorName = "Unassigned";
    let validMentorId: any = undefined;

    // Validate mentor is a user with Lead role
    if (mentorId) {
      const lead = await User.findById(mentorId);
      if (!lead || lead.role !== "Lead") {
        res.status(400).json({ message: "Invalid Lead assignment: mentorId must refer to an active Lead user." });
        return;
      }
      mentorName = lead.name;
      validMentorId = lead._id;
    }

    const initials = name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    const hashedPassword = await bcrypt.hash("password123", 10);

    const newUser = new User({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      role: "Intern",
      department: department || "Technology",
      avatar: avatar || initials || "II",
    });
    await newUser.save();

    const newIntern = new Intern({
      userId: newUser._id,
      batchId,
      track,
      mentor: mentorName,
      mentorId: validMentorId,
      status: status || "active",
      employmentType: employmentType || "intern",
      avatar: avatar || initials || "II",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      taskCompletionPercentage: 0,
      attendancePercentage: 100,
      performance: 80,
      lmsProgress: 0,
      tasksCompleted: 0,
    });
    await newIntern.save();

    const result = await Intern.findById(newIntern._id)
      .populate("userId", "-password")
      .populate("batchId");

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// PUT /api/interns/:id
export const updateIntern = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  // Only Admins can edit employee details
  if (req.user.role !== "Admin") {
    res.status(403).json({ message: "Access forbidden: only Admin can edit employee records." });
    return;
  }

  const { id } = req.params;
  const {
    name,
    email,
    track,
    mentorId,
    batchId,
    status,
    startDate,
    endDate,
    performance,
    lmsProgress,
    tasksCompleted,
    currentTaskId,
    taskCompletionPercentage,
    attendancePercentage,
    department,
    employmentType
  } = req.body;

  try {
    const intern = await Intern.findById(id);
    if (!intern) {
      res.status(404).json({ message: "Intern not found." });
      return;
    }

    // Update User details if name, email, or department changed
    const userUpdates: any = {};
    if (name) userUpdates.name = name;
    if (department) userUpdates.department = department;
    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      const emailExists = await User.findOne({ email: normalizedEmail, _id: { $ne: intern.userId } });
      if (emailExists) {
        res.status(400).json({ message: "Email is already in use by another account." });
        return;
      }
      userUpdates.email = normalizedEmail;
    }
    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(intern.userId, userUpdates);
    }

    // Update Intern profile details
    if (track) intern.track = track;
    if (batchId) {
      const batchExists = await Batch.findById(batchId);
      if (!batchExists) {
        res.status(404).json({ message: "Specified Batch not found." });
        return;
      }
      intern.batchId = batchId;
    }
    if (status) intern.status = status;
    if (startDate) intern.startDate = new Date(startDate);
    if (endDate) intern.endDate = new Date(endDate);
    if (performance !== undefined) intern.performance = Number(performance);
    if (lmsProgress !== undefined) intern.lmsProgress = Number(lmsProgress);
    if (tasksCompleted !== undefined) intern.tasksCompleted = Number(tasksCompleted);
    if (currentTaskId !== undefined) intern.currentTaskId = currentTaskId || undefined;
    if (taskCompletionPercentage !== undefined) intern.taskCompletionPercentage = Number(taskCompletionPercentage);
    if (attendancePercentage !== undefined) intern.attendancePercentage = Number(attendancePercentage);
    if (employmentType) intern.employmentType = employmentType;

    // Mentor reassignment and validation
    if (mentorId !== undefined) {
      if (mentorId === null || mentorId === "") {
        intern.mentorId = undefined;
        intern.mentor = "Unassigned";
      } else {
        const lead = await User.findById(mentorId);
        if (!lead || lead.role !== "Lead") {
          res.status(400).json({ message: "Invalid Lead assignment: mentorId must refer to an active Lead user." });
          return;
        }
        intern.mentorId = lead._id;
        intern.mentor = lead.name;
      }
    }

    await intern.save();

    const result = await Intern.findById(intern._id)
      .populate("userId", "-password")
      .populate("batchId");

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// DELETE /api/interns/:id
export const deleteIntern = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  // Only Admins can terminate employees
  if (req.user.role !== "Admin") {
    res.status(403).json({ message: "Access forbidden: only Admin can terminate employee accounts." });
    return;
  }

  const { id } = req.params;

  try {
    const intern = await Intern.findById(id);
    if (!intern) {
      res.status(404).json({ message: "Intern not found." });
      return;
    }

    // Terminate both the User account and Intern card
    await User.findByIdAndDelete(intern.userId);
    await Intern.findByIdAndDelete(id);

    res.status(200).json({ message: "Intern and associated user account deleted successfully." });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/interns/me/onboarding - Get onboarding checklist progress
export const getOnboardingStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    let intern = await Intern.findOne({ userId: req.user.id });
    if (!intern) {
      res.status(404).json({ message: "Intern profile not found." });
      return;
    }

    if (!intern.onboarding || !intern.onboarding.checklist) {
      intern.onboarding = {
        completed: false,
        checklist: {
          profileCompleted: false,
          guideRead: false,
          tasksReviewed: false,
          standupSubmitted: false,
          attendanceMarked: false
        }
      };
      await intern.save();
    }

    res.status(200).json(intern.onboarding);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// POST /api/interns/me/onboarding/complete-step - Mark onboarding step as complete
export const completeOnboardingStep = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  const { step } = req.body;

  if (!step) {
    res.status(400).json({ message: "Step name is required." });
    return;
  }

  try {
    const intern = await Intern.findOne({ userId: req.user.id });
    if (!intern) {
      res.status(404).json({ message: "Intern profile not found." });
      return;
    }

    if (!intern.onboarding || !intern.onboarding.checklist) {
      intern.onboarding = {
        completed: false,
        checklist: {
          profileCompleted: false,
          guideRead: false,
          tasksReviewed: false,
          standupSubmitted: false,
          attendanceMarked: false
        }
      };
    }

    const checklistKeys = ["profileCompleted", "guideRead", "tasksReviewed", "standupSubmitted", "attendanceMarked"];
    if (!checklistKeys.includes(step)) {
      res.status(400).json({ message: `Invalid step. Allowed keys: ${checklistKeys.join(", ")}` });
      return;
    }

    (intern.onboarding.checklist as any)[step] = true;

    // Check if all steps completed
    const allDone = checklistKeys.every(k => (intern.onboarding.checklist as any)[k] === true);
    if (allDone) {
      intern.onboarding.completed = true;
    }

    await intern.save();
    res.status(200).json(intern.onboarding);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
