import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "Lead" | "Intern";
  department: string;
  avatar: string;
  joinedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["Lead", "Intern"], required: true },
  department: { type: String, required: true },
  avatar: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export const User = mongoose.model<IUser>("User", UserSchema);
