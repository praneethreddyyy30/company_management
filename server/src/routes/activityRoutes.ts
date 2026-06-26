import { Router } from "express";
import { getActivityLogs } from "../controllers/activityController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticateJWT as any, getActivityLogs as any);

export default router;
