import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

// Import all models
import { User } from "../models/User";
import { Intern } from "../models/Intern";
import { Batch } from "../models/Batch";
import { Task } from "../models/Task";
import { Standup } from "../models/Standup";
import { Attendance } from "../models/Attendance";
import { LeaveRequest } from "../models/LeaveRequest";
import { Announcement } from "../models/Announcement";
import { Notification } from "../models/Notification";
import { AIPerformance } from "../models/AIPerformance";
import { Certificate } from "../models/Certificate";
import { OfferLetter } from "../models/OfferLetter";
import { ActivityLog } from "../models/ActivityLog";

// Load active environment config
const nodeEnv = process.env.NODE_ENV || "development";
const envFile = `.env.${nodeEnv}`;
dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const modelsMap: Record<string, mongoose.Model<any>> = {
  User,
  Intern,
  Batch,
  Task,
  Standup,
  Attendance,
  LeaveRequest,
  Announcement,
  Notification,
  AIPerformance,
  Certificate,
  OfferLetter,
  ActivityLog
};

const runBackup = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("[Backup Error] MONGO_URI environment variable is not defined.");
      process.exit(1);
    }

    console.log(`[Backup] Connecting to Database: ${mongoUri.replace(/:([^:@]+)@/, ":***@")}...`);
    await mongoose.connect(mongoUri);

    // Create backups directory if it doesn't exist
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupDir = path.join(__dirname, "../../../backups", timestamp);
    
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    console.log(`[Backup] Creating backup directory: ${backupDir}`);

    for (const [modelName, model] of Object.entries(modelsMap)) {
      console.log(`[Backup] Fetching collection: ${model.collection.name}...`);
      const documents = await model.find({});
      
      const filePath = path.join(backupDir, `${model.collection.name}.json`);
      fs.writeFileSync(filePath, JSON.stringify(documents, null, 2), "utf8");
      console.log(`[Backup] Saved ${documents.length} records to ${model.collection.name}.json`);
    }

    console.log(`\n[Backup SUCCESS] Database backup completed successfully at: ${backupDir}`);
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("[Backup Error] Failed to export database:", error);
    process.exit(1);
  }
};

runBackup();
