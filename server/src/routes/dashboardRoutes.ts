import { Router } from "express";
import { getDashboardStats } from "../controllers/analyticsController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

router.get("/", authenticateJWT as any, getDashboardStats as any);

export default router;
