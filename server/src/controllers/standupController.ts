import { Response } from "express";
import { Standup } from "../models/Standup";
import { Intern } from "../models/Intern";
import { User } from "../models/User";
import { AuthRequest } from "../middlewares/authMiddleware";
import { createNotification } from "../services/notificationService";
import { io } from "../app";

// Helper to normalize date to Start of Day (00:00:00) in configured timezone
export const getNormalizedToday = (): Date => {
  const tz = process.env.TIMEZONE || "Asia/Kolkata";
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: tz,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = formatter.formatToParts(new Date());
  const month = parts.find(p => p.type === "month")?.value;
  const day = parts.find(p => p.type === "day")?.value;
  const year = parts.find(p => p.type === "year")?.value;
  
  return new Date(`${year}-${month}-${day}T00:00:00.000Z`);
};

// POST /api/standups - Intern submits daily standup
export const submitStandup = async (req: AuthRequest, res: Response): Promise<void> => {
  const { yesterdayWork, todayPlan, blockers, mood, completionPercentage } = req.body;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role !== "Intern") {
    res.status(403).json({ message: "Access forbidden: only interns can submit standups." });
    return;
  }

  if (!yesterdayWork || !todayPlan || !mood || completionPercentage === undefined) {
    res.status(400).json({ message: "Yesterday's work, Today's plan, Mood, and Completion percentage are required." });
    return;
  }

  try {
    const normalizedDate = getNormalizedToday();

    // Check for duplicate submission today
    const existing = await Standup.findOne({ internId: req.user.id, date: normalizedDate });
    if (existing) {
      res.status(400).json({ message: "You have already submitted a standup for today." });
      return;
    }

    const standup = new Standup({
      internId: req.user.id,
      date: normalizedDate,
      yesterdayWork,
      todayPlan,
      blockers: blockers || "None",
      mood,
      completionPercentage: Number(completionPercentage),
      submittedAt: new Date(),
    });
    await standup.save();

    // Automatically sync Intern profile task completion rate and update onboarding checklist
    const intern = await Intern.findOne({ userId: req.user.id });
    if (intern) {
      intern.taskCompletionPercentage = Number(completionPercentage);
      if (intern.onboarding && intern.onboarding.checklist) {
        intern.onboarding.checklist.standupSubmitted = true;
        const checklistKeys = ["profileCompleted", "guideRead", "tasksReviewed", "standupSubmitted", "attendanceMarked"];
        const allDone = checklistKeys.every(k => (intern.onboarding.checklist as any)[k] === true);
        if (allDone) {
          intern.onboarding.completed = true;
        }
      }
      await intern.save();
    }

    // Populate user info for broadcast
    const populated = await Standup.findById(standup._id).populate("internId", "name email avatar");

    // Socket.io broad propagation
    io.emit("standup:submitted", populated);

    // Notify Leads
    const leads = await User.find({ role: "Lead" });
    for (const lead of leads) {
      await createNotification(
        lead._id,
        "Daily Standup Submitted",
        `${req.user.name} submitted their daily standup.`,
        "Work",
        "info"
      );
    }

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/standups - Lead gets all standups
export const getAllStandups = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const standups = await Standup.find({}).populate("internId", "name email role avatar").sort({ date: -1 });
    res.status(200).json(standups);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/standups/:internId - Get standups for a specific intern
export const getStandupsByIntern = async (req: AuthRequest, res: Response): Promise<void> => {
  const { internId } = req.params;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  // Guard: Interns can only fetch their own standups
  if (req.user.role === "Intern" && req.user.id !== internId) {
    res.status(403).json({ message: "Access forbidden: you can only view your own standups." });
    return;
  }

  try {
    const standups = await Standup.find({ internId }).populate("internId", "name email role avatar").sort({ date: -1 });
    res.status(200).json(standups);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
