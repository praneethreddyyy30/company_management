import { Router } from "express";
import { viewPerformanceSummary, regeneratePerformanceSummary, copilotChat } from "../controllers/aiController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

// Apply JWT authentication globally for AI endpoints
router.use(authenticateJWT);

router.post("/chat", copilotChat);
router.get("/:internId", viewPerformanceSummary);
router.post("/:internId/regenerate", regeneratePerformanceSummary);

export default router;
