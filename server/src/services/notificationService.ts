import { Notification } from "../models/Notification";
import { io } from "../app";
import mongoose from "mongoose";

export const createNotification = async (
  recipientId: string | mongoose.Types.ObjectId,
  title: string,
  message: string,
  module = "HRM",
  type = "info"
): Promise<any> => {
  try {
    const notification = new Notification({
      recipientId,
      title,
      message,
      module,
      type,
      read: false,
    });
    await notification.save();

    // Prepare payload formatted for the client
    const payload = {
      id: notification._id,
      title: notification.title,
      message: notification.message,
      type: notification.type,
      createdAt: notification.createdAt,
      read: notification.read,
      module: notification.module,
    };

    // Emit event strictly to the recipient's private room
    io.to(recipientId.toString()).emit("notification:received", payload);

    return notification;
  } catch (error) {
    console.error("Error creating notification:", error);
    throw error;
  }
};
