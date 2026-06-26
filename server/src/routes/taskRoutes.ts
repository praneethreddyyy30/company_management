import { Router } from "express";
import {
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from "../controllers/taskController";
import { authenticateJWT, requireRole } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/tasks - View tasks (Interns see only theirs, Leads see all)
router.get("/", authenticateJWT as any, getAllTasks as any);

// GET /api/tasks/:id - View specific task details
router.get("/:id", authenticateJWT as any, getTaskById as any);

// POST /api/tasks - Create a task (Lead only)
router.post("/", authenticateJWT as any, requireRole(["Lead"]) as any, createTask as any);

// PUT /api/tasks/:id - Update a task (Lead can update all, Intern can only update status of their task)
router.put("/:id", authenticateJWT as any, updateTask as any);

// DELETE /api/tasks/:id - Delete a task (Lead only)
router.delete("/:id", authenticateJWT as any, requireRole(["Lead"]) as any, deleteTask as any);

export default router;
