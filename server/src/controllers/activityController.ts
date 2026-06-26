import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { ActivityLog } from "../models/ActivityLog";

export const getActivityLogs = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    let query: any = {};
    if (req.user.role === "Intern") {
      query.userId = req.user.id;
    }

    const logs = await ActivityLog.find(query)
      .sort({ timestamp: -1 })
      .limit(100);

    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
