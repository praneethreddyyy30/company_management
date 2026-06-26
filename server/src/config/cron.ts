import cron from "node-cron";
import { Intern } from "../models/Intern";
import { Attendance } from "../models/Attendance";
import { getNormalizedToday } from "../controllers/standupController";
import { createNotification } from "../services/notificationService";
import { runWeeklyPerformanceAudit } from "../controllers/aiController";

// Function containing check-in audit logic
export const markAbsentForInactiveInterns = async () => {
  console.log("[Cron] Running daily attendance audit to mark absent interns...");
  try {
    const normalizedDate = getNormalizedToday();
    const activeInterns = await Intern.find({ status: "active" });

    let count = 0;
    for (const intern of activeInterns) {
      // Check if they have checked in or if they have an approved leave request today
      const attendance = await Attendance.findOne({ 
        internId: intern.userId, 
        date: normalizedDate 
      });

      if (!attendance) {
        // No check-in recorded for today: Mark as Absent
        const absentRecord = new Attendance({
          internId: intern.userId,
          date: normalizedDate,
          checkIn: normalizedDate, // Default check-in time placeholder
          checkOut: normalizedDate,
          status: "Absent",
          totalHours: 0,
        });
        await absentRecord.save();
        count++;

        // Notify Intern cardholder
        await createNotification(
          intern.userId,
          "Marked Absent",
          "You have been automatically marked absent for today.",
          "HRM",
          "warning"
        );
      }
    }
    console.log(`[Cron] Attendance audit finished. Marked ${count} intern(s) absent.`);
  } catch (error) {
    console.error("[Cron] Error running attendance audit:", error);
  }
};

export const initCronJobs = () => {
  const absentTime = process.env.ABSENT_MARK_TIME || "11:00";
  const [hour, minute] = absentTime.split(":");
  const cronExpression = `${minute} ${hour} * * *`;

  console.log(`[Cron] Initializing Daily Absent Cron Job at ${absentTime} (Schedule: "${cronExpression}") in Timezone: ${process.env.TIMEZONE || "Asia/Kolkata"}`);
  
  // Register Cron
  cron.schedule(
    cronExpression,
    async () => {
      await markAbsentForInactiveInterns();
    },
    {
      scheduled: true,
      timezone: process.env.TIMEZONE || "Asia/Kolkata",
    }
  );

  console.log(`[Cron] Initializing Weekly AI Performance Cron Job at 09:00 AM every Monday in Timezone: ${process.env.TIMEZONE || "Asia/Kolkata"}`);
  // Register AI Weekly Review (Every Monday at 9:00 AM local time)
  cron.schedule(
    "0 9 * * 1",
    async () => {
      await runWeeklyPerformanceAudit();
    },
    {
      scheduled: true,
      timezone: process.env.TIMEZONE || "Asia/Kolkata",
    }
  );
};
