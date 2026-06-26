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

const runRestore = async () => {
  try {
    const mongoUri = process.env.MONGO_URI;
    if (!mongoUri) {
      console.error("[Restore Error] MONGO_URI environment variable is not defined.");
      process.exit(1);
    }

    // Determine backup folder path
    const backupsRoot = path.join(__dirname, "../../../backups");
    if (!fs.existsSync(backupsRoot)) {
      console.error(`[Restore Error] Backups directory "${backupsRoot}" does not exist.`);
      process.exit(1);
    }

    let targetDir = process.argv[2]; // e.g. timestamp folder
    if (!targetDir) {
      // Find the latest folder
      const folders = fs.readdirSync(backupsRoot).filter(f => {
        return fs.statSync(path.join(backupsRoot, f)).isDirectory();
      });

      if (folders.length === 0) {
        console.error("[Restore Error] No backup directories found.");
        process.exit(1);
      }

      // Sort alphabetically (since ISO timestamp format sorts correctly)
      folders.sort();
      targetDir = folders[folders.length - 1];
    }

    const backupPath = path.isAbsolute(targetDir) ? targetDir : path.join(backupsRoot, targetDir);
    if (!fs.existsSync(backupPath)) {
      console.error(`[Restore Error] Specified backup path does not exist: ${backupPath}`);
      process.exit(1);
    }

    console.log(`[Restore] Restoring database from: ${backupPath}`);
    console.log(`[Restore] Connecting to Database: ${mongoUri.replace(/:([^:@]+)@/, ":***@")}...`);
    await mongoose.connect(mongoUri);

    for (const [modelName, model] of Object.entries(modelsMap)) {
      const collectionName = model.collection.name;
      const filePath = path.join(backupPath, `${collectionName}.json`);

      if (!fs.existsSync(filePath)) {
        console.warn(`[Restore WARNING] Backup file not found for collection: ${collectionName}. Skipping.`);
        continue;
      }

      console.log(`[Restore] Clearing active collection: ${collectionName}...`);
      await model.deleteMany({});

      const fileData = fs.readFileSync(filePath, "utf8");
      const documents = JSON.parse(fileData);

      if (documents.length > 0) {
        console.log(`[Restore] Inserting ${documents.length} records into ${collectionName}...`);
        
        // Mongoose insertMany will preserve user-specified _id if it's in the array
        await model.insertMany(documents);
      } else {
        console.log(`[Restore] Collection ${collectionName} was empty.`);
      }
    }

    console.log("\n[Restore SUCCESS] Database restored successfully from backup.");
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("[Restore Error] Failed to restore database:", error);
    process.exit(1);
  }
};

runRestore();
