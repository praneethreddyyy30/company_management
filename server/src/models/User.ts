import mongoose, { Schema, Document } from "mongoose";

export interface IUser extends Document {
  name: string;
  email: string;
  password?: string;
  role: "Admin" | "Lead" | "Intern";
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
  role: { type: String, enum: ["Admin", "Lead", "Intern"], required: true },
  department: { type: String, required: true },
  avatar: { type: String, required: true },
  joinedAt: { type: Date, default: Date.now }
}, { timestamps: true });

UserSchema.pre("findOneAndDelete", async function(next) {
  try {
    const query = this.getQuery();
    const user = await mongoose.model("User").findOne(query);
    if (user && user.role === "Lead") {
      await mongoose.model("Intern").updateMany(
        { mentorId: user._id },
        { $set: { mentorId: null, mentor: "Unassigned" } }
      );
    }
  } catch (err) {
    console.error("Error in User findOneAndDelete hook:", err);
  }
  next();
});

export const User = mongoose.model<IUser>("User", UserSchema);
