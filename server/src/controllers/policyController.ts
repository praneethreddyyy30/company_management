import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Policy } from "../models/Policy";
import { logActivity } from "../services/activityService";

// GET /api/policies
export const getAllPolicies = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const policies = await Policy.find({}).sort({ updatedAt: -1 });
    res.status(200).json(policies);
  } catch (error) {
    res.status(500).json({ message: `Failed to load policies: ${(error as Error).message}` });
  }
};

// POST /api/policies
export const createPolicy = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  if (req.user.role !== "Lead") {
    res.status(403).json({ message: "Access forbidden: only Leads can create policies." });
    return;
  }

  const { title, category, version, fileSize } = req.body;

  if (!title || !category) {
    res.status(400).json({ message: "Title and category are required." });
    return;
  }

  try {
    const policy = new Policy({
      title,
      category,
      version: version || "1.0.0",
      fileSize: fileSize || "1.2 MB",
      lastUpdated: new Date()
    });

    await policy.save();

    await logActivity(
      req.user.id,
      req.user.name,
      "POLICY_CREATED",
      `Published policy document: ${title}`,
      "Policies",
      "LOW",
      req
    );

    res.status(201).json(policy);
  } catch (error) {
    res.status(500).json({ message: `Failed to publish policy: ${(error as Error).message}` });
  }
};
