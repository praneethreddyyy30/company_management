import mongoose, { Schema, Document } from "mongoose";

export interface IPolicy extends Document {
  title: string;
  category: string;
  lastUpdated: Date;
  version: string;
  fileSize: string;
  createdAt: Date;
  updatedAt: Date;
}

const PolicySchema = new Schema<IPolicy>({
  title: { type: String, required: true },
  category: { type: String, required: true },
  lastUpdated: { type: Date, default: Date.now },
  version: { type: String, default: "1.0.0" },
  fileSize: { type: String, default: "1.2 MB" }
}, { timestamps: true });

export const Policy = mongoose.model<IPolicy>("Policy", PolicySchema);
