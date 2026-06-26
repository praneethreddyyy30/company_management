import { Router } from "express";
import {
  applyLeave,
  updateLeaveStatus,
  getAllLeaves,
} from "../controllers/leaveController";
import { authenticateJWT, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/leaves - Apply leave (Intern only)
router.post("/", authenticateJWT as any, requireRole(["Intern"]) as any, applyLeave as any);

// PUT /api/leaves/:id/status - Approve or reject leave (Lead only)
router.put("/:id/status", authenticateJWT as any, requireRole(["Lead"]) as any, updateLeaveStatus as any);

// GET /api/leaves - View leave requests
router.get("/", authenticateJWT as any, getAllLeaves as any);

export default router;
