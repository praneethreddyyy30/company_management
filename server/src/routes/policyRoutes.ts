import { Router } from "express";
import { getAllPolicies, createPolicy } from "../controllers/policyController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

router.use(authenticateJWT);

router.get("/", getAllPolicies);
router.post("/", createPolicy);

export default router;
