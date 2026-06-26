import { Router } from "express";
import {
  getUserNotifications,
  markNotificationAsRead,
  getUnreadCount,
} from "../controllers/notificationController";
import { authenticateJWT } from "../middlewares/authMiddleware";

const router = Router();

// GET /api/notifications - View user notifications
router.get("/", authenticateJWT as any, getUserNotifications as any);

// GET /api/notifications/unread-count - View count of unread notifications
router.get("/unread-count", authenticateJWT as any, getUnreadCount as any);

// PUT /api/notifications/:id/read - Mark notification as read
router.put("/:id/read", authenticateJWT as any, markNotificationAsRead as any);

export default router;
