import { Router } from "express";
import {
  getAllInterns,
  getInternById,
  createIntern,
  updateIntern,
  deleteIntern,
  getOnboardingStatus,
  completeOnboardingStep
} from "../controllers/internController";
import { authenticateJWT, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// Onboarding checklist workflows (must be defined before /:id)
router.get("/me/onboarding", authenticateJWT as any, getOnboardingStatus as any);
router.post("/me/onboarding/complete-step", authenticateJWT as any, completeOnboardingStep as any);

// GET /api/interns
router.get("/", authenticateJWT as any, getAllInterns as any);

// GET /api/interns/:id
router.get("/:id", authenticateJWT as any, getInternById as any);

// POST /api/interns
router.post("/", authenticateJWT as any, requireRole(["Admin"]) as any, createIntern as any);

// PUT /api/interns/:id
router.put("/:id", authenticateJWT as any, requireRole(["Admin"]) as any, updateIntern as any);

// DELETE /api/interns/:id
router.delete("/:id", authenticateJWT as any, requireRole(["Admin"]) as any, deleteIntern as any);

export default router;
