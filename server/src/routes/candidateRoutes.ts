import { Router } from "express";
import { getAllCandidates, updateCandidateStage, createCandidate } from "../controllers/candidateController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateJWT);

router.get("/", getAllCandidates);
router.post("/", createCandidate);
router.put("/:id/stage", updateCandidateStage);

export default router;
