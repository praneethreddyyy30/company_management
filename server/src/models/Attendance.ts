import mongoose, { Schema, Document } from "mongoose";

export interface IAttendance extends Document {
  internId: mongoose.Types.ObjectId;
  date: Date;
  checkIn: Date;
  checkOut?: Date;
  status: "Present" | "Absent" | "Late" | "Leave";
  totalHours: number;
  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>({
  internId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  date: { type: Date, required: true, index: true },
  checkIn: { type: Date, required: true },
  checkOut: { type: Date },
  status: { type: String, enum: ["Present", "Absent", "Late", "Leave"], default: "Present", index: true },
  totalHours: { type: Number, default: 0 }
}, { timestamps: true });

export const Attendance = mongoose.model<IAttendance>("Attendance", AttendanceSchema);
