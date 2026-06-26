import mongoose, { Schema, Document } from "mongoose";

export interface ILeaveRequest extends Document {
  employeeId: mongoose.Types.ObjectId;
  employeeName: string;
  type: "casual" | "sick" | "earned";
  fromDate: Date;
  toDate: Date;
  days: number;
  reason: string;
  status: "Pending" | "Approved" | "Rejected";
  appliedAt: Date;
  approvedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const LeaveRequestSchema = new Schema<ILeaveRequest>({
  employeeId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  employeeName: { type: String, required: true },
  type: { type: String, enum: ["casual", "sick", "earned"], required: true },
  fromDate: { type: Date, required: true, index: true },
  toDate: { type: Date, required: true, index: true },
  days: { type: Number, required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ["Pending", "Approved", "Rejected"], default: "Pending", index: true },
  appliedAt: { type: Date, default: Date.now },
  approvedBy: { type: Schema.Types.ObjectId, ref: "User" }
}, { timestamps: true });

export const LeaveRequest = mongoose.model<ILeaveRequest>("LeaveRequest", LeaveRequestSchema);
