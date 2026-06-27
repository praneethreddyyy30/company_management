import { Response } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Evaluation } from "../models/Evaluation";
import { User } from "../models/User";
import { Intern } from "../models/Intern";
import { logActivity } from "../services/activityService";

// GET /api/evaluations
export const getAllEvaluations = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    let query: any = {};

    // Interns: see their own evaluations
    if (req.user.role === "Intern") {
      query.internId = req.user.id;
    }

    // Leads: see evaluations of interns assigned to them
    if (req.user.role === "Lead") {
      const myInterns = await Intern.find({ mentorId: req.user.id });
      const myInternUserIds = myInterns.map((i) => i.userId);
      query.internId = { $in: myInternUserIds };
    }

    const evaluations = await Evaluation.find(query).sort({ date: -1 });
    res.status(200).json(evaluations);
  } catch (error) {
    res.status(500).json({ message: `Failed to load evaluations: ${(error as Error).message}` });
  }
};

// POST /api/evaluations
export const createEvaluation = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  // Only Lead and Admin can evaluate interns
  if (req.user.role !== "Lead" && req.user.role !== "Admin") {
    res.status(403).json({ message: "Access forbidden: only Leads and Admins can submit evaluations." });
    return;
  }

  const { internId, rating, comment, category } = req.body;

  if (!internId || !rating || !comment) {
    res.status(400).json({ message: "internId, rating, and comment are required." });
    return;
  }

  try {
    const targetUser = await User.findById(internId);
    if (!targetUser) {
      res.status(404).json({ message: "Intern user not found." });
      return;
    }

    // Leads: can only evaluate their assigned interns
    if (req.user.role === "Lead") {
      const targetIntern = await Intern.findOne({ userId: internId });
      if (!targetIntern || !targetIntern.mentorId || targetIntern.mentorId.toString() !== req.user.id) {
        res.status(403).json({ message: "Access forbidden: you can only evaluate your assigned interns." });
        return;
      }
    }

    const evaluation = new Evaluation({
      internId,
      evaluator: req.user.name,
      rating: Number(rating),
      comment,
      category: category || "Technical",
      date: new Date()
    });

    await evaluation.save();

    await logActivity(
      req.user.id,
      req.user.name,
      "EVALUATION_CREATED",
      `Created performance evaluation for ${targetUser.name}`,
      "Evaluations",
      "MED",
      req
    );

    res.status(201).json(evaluation);
  } catch (error) {
    res.status(500).json({ message: `Failed to create evaluation: ${(error as Error).message}` });
  }
};
