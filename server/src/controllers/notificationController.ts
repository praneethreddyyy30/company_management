import { Response } from "express";
import { Notification } from "../models/Notification";
import { AuthRequest } from "../middlewares/authMiddleware";

// GET /api/notifications - Fetch user's notification list
export const getUserNotifications = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    const list = await Notification.find({ recipientId: req.user.id }).sort({ createdAt: -1 });
    
    // Format payload keys exactly as requested
    const formatted = list.map(n => ({
      id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      createdAt: n.createdAt,
      read: n.read,
      module: n.module,
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// PUT /api/notifications/:id/read - Mark specific notification as read
export const markNotificationAsRead = async (req: AuthRequest, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    const notification = await Notification.findById(id);
    if (!notification) {
      res.status(404).json({ message: "Notification not found." });
      return;
    }

    // Security guard: users can only mark their own notifications as read
    if (notification.recipientId.toString() !== req.user.id) {
      res.status(403).json({ message: "Access forbidden: you cannot modify other users' notifications." });
      return;
    }

    notification.read = true;
    await notification.save();

    res.status(200).json({
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
      read: notification.read,
      module: notification.module,
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/notifications/unread-count - Get unread count
export const getUnreadCount = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    const count = await Notification.countDocuments({ recipientId: req.user.id, read: false });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
