import mongoose, { Schema, Document } from "mongoose";

export interface IIntern extends Document {
  userId: mongoose.Types.ObjectId;
  batchId: mongoose.Types.ObjectId;
  track: string; // e.g. "Frontend", "Backend", "UI/UX", "Marketing"
  mentor: string; // Name of the mentor assigned
  mentorId?: mongoose.Types.ObjectId; // Lead assigned to this intern
  status: "active" | "leave" | "off-active" | "completed";
  employmentType: "full-time" | "intern" | "part-time" | "contract";
  avatar: string;
  startDate: Date;
  endDate: Date;
  currentTaskId?: mongoose.Types.ObjectId;
  taskCompletionPercentage: number;
  attendancePercentage: number;
  performance: number;
  lmsProgress: number;
  tasksCompleted: number;
  onboarding: {
    completed: boolean;
    checklist: {
      profileCompleted: boolean;
      guideRead: boolean;
      tasksReviewed: boolean;
      standupSubmitted: boolean;
      attendanceMarked: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const InternSchema = new Schema<IIntern>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  batchId: { type: Schema.Types.ObjectId, ref: "Batch", required: true, index: true },
  track: { type: String, required: true, index: true },
  mentor: { type: String, default: "Unassigned" },
  mentorId: { type: Schema.Types.ObjectId, ref: "User", index: true },
  status: { type: String, enum: ["active", "leave", "off-active", "completed"], default: "active", index: true },
  employmentType: { type: String, enum: ["full-time", "intern", "part-time", "contract"], default: "intern", index: true },
  avatar: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  currentTaskId: { type: Schema.Types.ObjectId, ref: "Task" },
  taskCompletionPercentage: { type: Number, default: 0, min: 0, max: 100 },
  attendancePercentage: { type: Number, default: 100, min: 0, max: 100 },
  performance: { type: Number, default: 80, min: 0, max: 100 },
  lmsProgress: { type: Number, default: 0, min: 0, max: 100 },
  tasksCompleted: { type: Number, default: 0 },
  onboarding: {
    completed: { type: Boolean, default: false },
    checklist: {
      profileCompleted: { type: Boolean, default: false },
      guideRead: { type: Boolean, default: false },
      tasksReviewed: { type: Boolean, default: false },
      standupSubmitted: { type: Boolean, default: false },
      attendanceMarked: { type: Boolean, default: false }
    }
  }
}, { timestamps: true });

export const Intern = mongoose.model<IIntern>("Intern", InternSchema);
