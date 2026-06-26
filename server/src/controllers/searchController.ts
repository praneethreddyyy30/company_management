import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { User } from "../models/User";
import { Intern } from "../models/Intern";
import { Task } from "../models/Task";
import { Batch } from "../models/Batch";
import { Announcement } from "../models/Announcement";

export const globalSearch = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  const q = req.query.q ? String(req.query.q).trim() : "";
  if (!q) {
    res.status(200).json({ interns: [], tasks: [], batches: [], announcements: [] });
    return;
  }

  try {
    const searchRegex = new RegExp(q, "i");
    const role = req.user.role;
    const currentUserId = req.user.id;

    // 1. ANNOUNCEMENTS (visible to everyone)
    const announcements = await Announcement.find({
      $or: [
        { title: searchRegex },
        { content: searchRegex }
      ]
    }).limit(10);

    // 2. FETCH CURRENT INTERN PROFILE IF ROLE IS INTERN
    let ownInternProfile: any = null;
    if (role === "Intern") {
      ownInternProfile = await Intern.findOne({ userId: currentUserId });
    }

    // 3. INTERNS SEARCH
    let interns: any[] = [];
    if (role === "Lead") {
      // Leads can search all users of role Intern matching name or email, or Intern.track
      const matchingUsers = await User.find({
        role: "Intern",
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      }).select("_id");
      const userIds = matchingUsers.map(u => u._id);

      interns = await Intern.find({
        $or: [
          { userId: { $in: userIds } },
          { track: searchRegex }
        ]
      })
      .populate("userId", "name email avatar department")
      .populate("batchId", "name")
      .limit(10);
    } else {
      // Interns can only search themselves
      const userMatches = await User.findOne({
        _id: currentUserId,
        $or: [
          { name: searchRegex },
          { email: searchRegex }
        ]
      });

      if (userMatches || (ownInternProfile && searchRegex.test(ownInternProfile.track))) {
        const intern = await Intern.findOne({ userId: currentUserId })
          .populate("userId", "name email avatar department")
          .populate("batchId", "name");
        if (intern) {
          interns = [intern];
        }
      }
    }

    // 4. TASKS SEARCH
    let tasks: any[] = [];
    if (role === "Lead") {
      // Leads search all tasks
      tasks = await Task.find({ title: searchRegex })
        .populate("assignedTo", "name email avatar")
        .limit(15);
    } else {
      // Interns search only their own assigned tasks
      tasks = await Task.find({
        assignedTo: currentUserId,
        title: searchRegex
      })
      .populate("assignedTo", "name email avatar")
      .limit(15);
    }

    // 5. BATCHES SEARCH
    let batches: any[] = [];
    if (role === "Lead") {
      // Leads search all batches
      batches = await Batch.find({ name: searchRegex }).limit(10);
    } else {
      // Interns only search their own batch if it matches
      if (ownInternProfile && ownInternProfile.batchId) {
        const matchedBatch = await Batch.findOne({
          _id: ownInternProfile.batchId,
          name: searchRegex
        });
        if (matchedBatch) {
          batches = [matchedBatch];
        }
      }
    }

    res.status(200).json({
      interns,
      tasks,
      batches,
      announcements
    });
  } catch (error) {
    res.status(500).json({ message: `Search failed: ${(error as Error).message}` });
  }
};
