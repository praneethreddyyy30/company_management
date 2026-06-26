import mongoose, { Schema, Document } from "mongoose";

export interface INotification extends Document {
  recipientId: mongoose.Types.ObjectId;
  title: string;
  message: string;
  module: string; // e.g. Talent, Leave, LMS, HRM, Policy, ERP, Work
  type: string; // e.g. info, success, warning, error
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>({
  recipientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  module: { type: String, required: true, default: "HRM" },
  type: { type: String, required: true, default: "info" },
  read: { type: Boolean, default: false }
}, { timestamps: true });

export const Notification = mongoose.model<INotification>("Notification", NotificationSchema);
