import { Router } from "express";
import {
  getAttendanceChart,
  getTaskChart,
  getStandupTrend,
  getLeaderboard,
  exportCSV
} from "../controllers/analyticsController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

router.get("/attendance-chart", authenticateJWT as any, getAttendanceChart as any);
router.get("/task-chart", authenticateJWT as any, getTaskChart as any);
router.get("/standup-trend", authenticateJWT as any, getStandupTrend as any);
router.get("/leaderboard", authenticateJWT as any, getLeaderboard as any);
router.get("/export", authenticateJWT as any, exportCSV as any);

export default router;
