import mongoose, { Schema, Document } from "mongoose";

export interface IAIPerformance extends Document {
  internId: mongoose.Types.ObjectId;
  compiledDate: Date;
  standupsCount: number;
  progressSummary: string;
  patternsObserved: string;
  constructiveRecommendation: string;
  grade: string;
  createdAt: Date;
  updatedAt: Date;
}

const AIPerformanceSchema = new Schema<IAIPerformance>({
  internId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  compiledDate: { type: Date, default: Date.now },
  standupsCount: { type: Number, default: 7 },
  progressSummary: { type: String, required: true },
  patternsObserved: { type: String, required: true },
  constructiveRecommendation: { type: String, required: true },
  grade: { type: String, required: true }
}, { timestamps: true });

export const AIPerformance = mongoose.model<IAIPerformance>("AIPerformance", AIPerformanceSchema);
