import { Router } from "express";
import { getAllEvaluations, createEvaluation } from "../controllers/evaluationController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateJWT);

router.get("/", getAllEvaluations);
router.post("/", createEvaluation);

export default router;
