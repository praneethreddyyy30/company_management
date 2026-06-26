import mongoose, { Schema, Document } from "mongoose";

export interface IBatch extends Document {
  name: string;
  startDate: Date;
  endDate: Date;
  mentorId: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const BatchSchema = new Schema<IBatch>({
  name: { type: String, required: true, unique: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  mentorId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

export const Batch = mongoose.model<IBatch>("Batch", BatchSchema);
