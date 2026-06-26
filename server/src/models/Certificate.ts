import mongoose, { Schema, Document } from "mongoose";

export interface ICertificate extends Document {
  internId: mongoose.Types.ObjectId;
  certificateNumber: string;
  status: "Pending" | "Approved" | "Rejected";
  documentType: string; // e.g. "Certificate"
  version: number;
  requestDate: Date;
  issuedAt?: Date;
  downloadPath?: string;
  issuedBy?: mongoose.Types.ObjectId;
  reason?: string;
  grade?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CertificateSchema = new Schema<ICertificate>({
  internId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  certificateNumber: { type: String, required: true, unique: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
  documentType: { type: String, default: "Certificate" },
  version: { type: Number, default: 1 },
  requestDate: { type: Date, default: Date.now },
  issuedAt: { type: Date },
  downloadPath: { type: String },
  issuedBy: { type: Schema.Types.ObjectId, ref: "User" },
  reason: { type: String },
  grade: { type: String }
}, { timestamps: true });

export const Certificate = mongoose.model<ICertificate>("Certificate", CertificateSchema);
