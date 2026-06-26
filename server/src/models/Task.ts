import mongoose, { Schema, Document } from "mongoose";

export interface ITask extends Document {
  title: string;
  assignedTo: mongoose.Types.ObjectId;
  priority: "high" | "medium" | "low";
  status: "Not Started" | "In Progress" | "Under Review" | "Done";
  dueDate: Date;
  module: string;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  assignedTo: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
  status: {
    type: String,
    enum: ["Not Started", "In Progress", "Under Review", "Done"],
    default: "Not Started",
    index: true
  },
  dueDate: { type: Date, required: true, index: true },
  module: { type: String, default: "General" }
}, { timestamps: true });

export const Task = mongoose.model<ITask>("Task", TaskSchema);
