import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Candidate } from "../models/Candidate";
import { logActivity } from "../services/activityService";

// GET /api/candidates
export const getAllCandidates = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== "Lead") {
    res.status(403).json({ message: "Access forbidden: only Leads can access candidates." });
    return;
  }

  try {
    const candidates = await Candidate.find({}).sort({ appliedAt: -1 });
    res.status(200).json(candidates);
  } catch (error) {
    res.status(500).json({ message: `Failed to load candidates: ${(error as Error).message}` });
  }
};

// PUT /api/candidates/:id/stage
export const updateCandidateStage = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== "Lead") {
    res.status(403).json({ message: "Access forbidden: only Leads can process candidates." });
    return;
  }

  const { id } = req.params;
  const { stage } = req.body;

  const validStages = ["applied", "screening", "interview", "offer", "onboarded"];
  if (!stage || !validStages.includes(stage)) {
    res.status(400).json({ message: `Invalid stage. Must be one of: ${validStages.join(", ")}` });
    return;
  }

  try {
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      res.status(404).json({ message: "Candidate not found." });
      return;
    }

    const oldStage = candidate.stage;
    candidate.stage = stage as any;
    if (stage === "interview") {
      candidate.interviewScheduled = true;
    }
    await candidate.save();

    await logActivity(
      req.user.id,
      req.user.name,
      "CANDIDATE_STAGE_UPDATED",
      `Moved candidate ${candidate.name} from stage ${oldStage} to ${stage}`,
      "Recruitment",
      "LOW",
      req
    );

    res.status(200).json(candidate);
  } catch (error) {
    res.status(500).json({ message: `Failed to update candidate: ${(error as Error).message}` });
  }
};

// POST /api/candidates
export const createCandidate = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user || req.user.role !== "Lead") {
    res.status(403).json({ message: "Access forbidden: only Leads can create candidates." });
    return;
  }

  const { name, role, aiMatchScore, resumeStrength } = req.body;

  if (!name || !role) {
    res.status(400).json({ message: "Name and role are required." });
    return;
  }

  try {
    const candidate = new Candidate({
      name,
      role,
      aiMatchScore: Number(aiMatchScore || 75),
      resumeStrength: resumeStrength || "Good",
      appliedAt: new Date()
    });

    await candidate.save();

    await logActivity(
      req.user.id,
      req.user.name,
      "CANDIDATE_CREATED",
      `Added candidate ${name} for role ${role}`,
      "Recruitment",
      "LOW",
      req
    );

    res.status(201).json(candidate);
  } catch (error) {
    res.status(500).json({ message: `Failed to add candidate: ${(error as Error).message}` });
  }
};
