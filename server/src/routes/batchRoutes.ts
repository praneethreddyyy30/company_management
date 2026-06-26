import { Router } from "express";
import {
  getAllBatches,
  getBatchById,
  createBatch,
  updateBatch,
  deleteBatch,
  getInternsByBatch,
} from "../controllers/batchController";
import { authenticateJWT, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/batches
router.get("/", authenticateJWT as any, getAllBatches as any);

// GET /api/batches/:id
router.get("/:id", authenticateJWT as any, getBatchById as any);

// POST /api/batches
router.post("/", authenticateJWT as any, requireRole(["Lead"]) as any, createBatch as any);

// PUT /api/batches/:id
router.put("/:id", authenticateJWT as any, requireRole(["Lead"]) as any, updateBatch as any);

// DELETE /api/batches/:id
router.delete("/:id", authenticateJWT as any, requireRole(["Lead"]) as any, deleteBatch as any);

// GET /api/batches/:id/interns
router.get("/:id/interns", authenticateJWT as any, requireRole(["Lead"]) as any, getInternsByBatch as any);

export default router;
