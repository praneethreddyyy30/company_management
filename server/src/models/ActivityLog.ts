import mongoose, { Schema, Document } from "mongoose";

export interface IActivityLog extends Document {
  userId: mongoose.Types.ObjectId;
  userName: string;
  action: string;
  details: string;
  module: string;
  impact: "LOW" | "MED" | "HIGH";
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

const ActivityLogSchema = new Schema<IActivityLog>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  userName: { type: String, required: true },
  action: { type: String, required: true },
  details: { type: String, required: true },
  module: { type: String, required: true },
  impact: { type: String, enum: ["LOW", "MED", "HIGH"], required: true },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
});

export const ActivityLog = mongoose.model<IActivityLog>("ActivityLog", ActivityLogSchema);
