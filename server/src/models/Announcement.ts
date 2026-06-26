import mongoose, { Schema, Document } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  authorId: mongoose.Types.ObjectId;
  authorName: string;
  priority: "high" | "normal";
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>({
  title: { type: String, required: true },
  content: { type: String, required: true },
  authorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  authorName: { type: String, required: true },
  priority: { type: String, enum: ["high", "normal"], default: "normal" }
}, { timestamps: true });

export const Announcement = mongoose.model<IAnnouncement>("Announcement", AnnouncementSchema);
