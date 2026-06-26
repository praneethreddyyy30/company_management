import mongoose from "mongoose";
import dotenv from "dotenv";
import { ActivityLog } from "../models/ActivityLog";

dotenv.config();

const run = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/klassygo_hrm";
    await mongoose.connect(mongoUri);
    const logs = await ActivityLog.find({}).sort({ timestamp: -1 }).limit(20);
    console.log("=== LATEST 20 ACTIVITY LOGS ===");
    for (const log of logs) {
      console.log(`[${log.timestamp.toISOString()}] User: ${log.userName} (${log.userId}) | Action: ${log.action} | Detail: ${log.details}`);
    }
    process.exit(0);
  } catch (err) {
    console.error("Error dumping logs:", err);
    process.exit(1);
  }
};

run();
