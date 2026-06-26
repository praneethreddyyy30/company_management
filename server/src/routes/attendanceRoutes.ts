import { Router } from "express";
import {
  checkIn,
  checkOut,
  getAttendanceHistory,
  getAttendanceHeatmap,
} from "../controllers/attendanceController";
import { authenticateJWT, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/attendance/check-in - Check in (Intern only)
router.post("/check-in", authenticateJWT as any, requireRole(["Intern"]) as any, checkIn as any);

// POST /api/attendance/check-out - Check out (Intern only)
router.post("/check-out", authenticateJWT as any, requireRole(["Intern"]) as any, checkOut as any);

// GET /api/attendance/history - View attendance history
router.get("/history", authenticateJWT as any, getAttendanceHistory as any);

// GET /api/attendance/heatmap - View activity heatmap grid
router.get("/heatmap", authenticateJWT as any, getAttendanceHeatmap as any);

export default router;
