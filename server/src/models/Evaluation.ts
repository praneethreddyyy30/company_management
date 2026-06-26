import mongoose, { Schema, Document } from "mongoose";

export interface IEvaluation extends Document {
  internId: mongoose.Types.ObjectId;
  evaluator: string;
  date: Date;
  rating: number;
  comment: string;
  category: string;
  createdAt: Date;
  updatedAt: Date;
}

const EvaluationSchema = new Schema<IEvaluation>({
  internId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  evaluator: { type: String, required: true },
  date: { type: Date, default: Date.now },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  category: { type: String, default: "Technical" }
}, { timestamps: true });

export const Evaluation = mongoose.model<IEvaluation>("Evaluation", EvaluationSchema);
