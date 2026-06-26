import mongoose, { Schema, Document } from "mongoose";

export interface IStandup extends Document {
  internId: mongoose.Types.ObjectId;
  date: Date; // Normalized to 00:00:00 start of day
  yesterdayWork: string;
  todayPlan: string;
  blockers: string;
  mood: string; // e.g. productive, tired, stressed
  completionPercentage: number; // task completion percent
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const StandupSchema = new Schema<IStandup>({
  internId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date: { type: Date, required: true }, // normalized start-of-day date
  yesterdayWork: { type: String, required: true },
  todayPlan: { type: String, required: true },
  blockers: { type: String, default: "None" },
  mood: { type: String, required: true },
  completionPercentage: { type: Number, required: true, min: 0, max: 100 },
  submittedAt: { type: Date, default: Date.now }
}, { timestamps: true });

// Enforce one standup per day per intern
StandupSchema.index({ internId: 1, date: 1 }, { unique: true });

export const Standup = mongoose.model<IStandup>("Standup", StandupSchema);
