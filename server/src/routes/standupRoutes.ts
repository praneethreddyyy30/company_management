import { Router } from "express";
import {
  submitStandup,
  getAllStandups,
  getStandupsByIntern,
} from "../controllers/standupController";
import { authenticateJWT, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/standups - Submit standup (Interns only)
router.post("/", authenticateJWT as any, requireRole(["Intern"]) as any, submitStandup as any);

// GET /api/standups - View all standups (Lead only)
router.get("/", authenticateJWT as any, requireRole(["Lead"]) as any, getAllStandups as any);

// GET /api/standups/:internId - View standups by specific intern (Lead can see all; Intern only see theirs)
router.get("/:internId", authenticateJWT as any, getStandupsByIntern as any);

export default router;
