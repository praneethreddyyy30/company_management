import mongoose, { Schema, Document } from "mongoose";

export interface ICandidate extends Document {
  name: string;
  role: string;
  stage: "applied" | "screening" | "interview" | "offer" | "onboarded";
  aiMatchScore: number;
  appliedAt: Date;
  resumeStrength: string;
  interviewScheduled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CandidateSchema = new Schema<ICandidate>({
  name: { type: String, required: true },
  role: { type: String, required: true },
  stage: { 
    type: String, 
    enum: ["applied", "screening", "interview", "offer", "onboarded"], 
    default: "applied", 
    index: true 
  },
  aiMatchScore: { type: Number, default: 75 },
  appliedAt: { type: Date, default: Date.now },
  resumeStrength: { type: String, default: "Good" },
  interviewScheduled: { type: Boolean, default: false }
}, { timestamps: true });

export const Candidate = mongoose.model<ICandidate>("Candidate", CandidateSchema);
