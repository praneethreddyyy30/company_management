import mongoose, { Schema, Document } from "mongoose";

export interface IOfferLetter extends Document {
  internId: mongoose.Types.ObjectId;
  salaryDetails: string;
  startDate: Date;
  downloadPath: string;
  generatedBy: mongoose.Types.ObjectId;
  documentType: string; // e.g. "OfferLetter"
  status: string; // e.g. "Issued"
  version: number;
  createdAt: Date;
  updatedAt: Date;
}

const OfferLetterSchema = new Schema<IOfferLetter>({
  internId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  salaryDetails: { type: String, required: true },
  startDate: { type: Date, required: true },
  downloadPath: { type: String, required: true },
  generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  documentType: { type: String, default: "OfferLetter" },
  status: { type: String, default: "Issued" },
  version: { type: Number, default: 1 }
}, { timestamps: true });

export const OfferLetter = mongoose.model<IOfferLetter>("OfferLetter", OfferLetterSchema);
