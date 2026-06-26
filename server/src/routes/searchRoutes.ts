import { Router } from "express";
import { globalSearch } from "../controllers/searchController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/search?q=...
router.get("/", authenticateJWT as any, globalSearch as any);

export default router;
