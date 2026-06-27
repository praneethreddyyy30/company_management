import mongoose from "mongoose";
import { User } from "../models/User";

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/klassygo_hrm";
    const conn = await mongoose.connect(mongoUri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // One-time startup migration: lowercase all user email addresses
    try {
      const usersToMigrate = await User.find({ email: { $regex: /[A-Z]/ } });
      if (usersToMigrate.length > 0) {
        console.log(`[Migration] Found ${usersToMigrate.length} user accounts with uppercase letters in emails. Lowercasing them...`);
        for (const user of usersToMigrate) {
          const oldEmail = user.email;
          user.email = user.email.toLowerCase();
          await user.save();
          console.log(`[Migration] Lowercased email: ${oldEmail} -> ${user.email}`);
        }
        console.log(`[Migration] Case normalization completed successfully.`);
      }
    } catch (migError) {
      console.warn(`[Migration] Failed to run lowercase email migration:`, migError);
    }
  } catch (error) {
    console.error(`MongoDB Connection Error: ${(error as Error).message}`);
    process.exit(1);
  }
};
