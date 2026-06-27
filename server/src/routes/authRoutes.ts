import { Router } from "express";
import { register, login, logout, getMe, getAllLeads, changePassword } from "../controllers/authController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

// POST /api/auth/register
router.post("/register", register as any);

// POST /api/auth/login
router.post("/login", login as any);

// POST /api/auth/logout
router.post("/logout", authenticateJWT as any, logout as any);

// GET /api/auth/me
router.get("/me", authenticateJWT as any, getMe as any);

// GET /api/auth/leads
router.get("/leads", authenticateJWT as any, getAllLeads as any);

// PUT /api/auth/change-password
router.put("/change-password", authenticateJWT as any, changePassword as any);

export default router;
