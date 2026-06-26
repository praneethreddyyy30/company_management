import { Response, Request } from "express";
import { AuthRequest } from "../middlewares/authMiddleware";
import { Intern } from "../models/Intern";
import { Task } from "../models/Task";
import { Standup } from "../models/Standup";
import { Attendance } from "../models/Attendance";
import { Batch } from "../models/Batch";
import { LeaveRequest } from "../models/LeaveRequest";
import { Notification } from "../models/Notification";
import { ActivityLog } from "../models/ActivityLog";
import { User } from "../models/User";
import mongoose from "mongoose";

// Helper to filter interns by batch and track
const getFilteredInterns = async (req: Request): Promise<any[]> => {
  const { batchId, track } = req.query;
  const filter: any = {};
  if (batchId) {
    filter.batchId = batchId;
  }
  if (track) {
    filter.track = track;
  }
  return await Intern.find(filter).populate("userId", "name email avatar");
};

// GET /api/analytics/attendance-chart
export const getAttendanceChart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interns = await getFilteredInterns(req);
    const internUserIds = interns.map(i => i.userId?._id || i.userId);

    const { startDate, endDate } = req.query;
    const dateMatch: any = {};
    if (startDate || endDate) {
      if (startDate) dateMatch.$gte = new Date(startDate as string);
      if (endDate) dateMatch.$lte = new Date(endDate as string);
    }

    const attendanceQuery: any = { internId: { $in: internUserIds } };
    if (Object.keys(dateMatch).length > 0) {
      attendanceQuery.date = dateMatch;
    }

    const records = await Attendance.find(attendanceQuery).sort({ date: 1 });

    // Grouping calculations
    let present = 0;
    let absent = 0;
    let late = 0;
    let leave = 0;

    const dailyMap: Record<string, { Present: number; Late: number; Absent: number; Leave: number }> = {};
    const monthlyMap: Record<string, { total: number; present: number }> = {};

    records.forEach(r => {
      const dateStr = r.date.toISOString().slice(0, 10);
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { Present: 0, Late: 0, Absent: 0, Leave: 0 };
      }

      if (r.status === "Present") {
        present++;
        dailyMap[dateStr].Present++;
      } else if (r.status === "Late") {
        late++;
        dailyMap[dateStr].Present++; // Count Late as Present/Late for charts
        dailyMap[dateStr].Late++;
      } else if (r.status === "Absent") {
        absent++;
        dailyMap[dateStr].Absent++;
      } else if (r.status === "Leave") {
        leave++;
        dailyMap[dateStr].Leave++;
      }

      // Monthly mapping
      const monthStr = r.date.toLocaleString("default", { month: "short", year: "2-digit" });
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = { total: 0, present: 0 };
      }
      monthlyMap[monthStr].total++;
      if (r.status === "Present" || r.status === "Late") {
        monthlyMap[monthStr].present++;
      }
    });

    const total = records.length;
    const attendanceRate = total > 0 ? Math.round(((present + late) / total) * 100) : 100;

    const dailyAttendance = Object.keys(dailyMap).map(d => ({
      date: d,
      ...dailyMap[d]
    }));

    const monthlyTrends = Object.keys(monthlyMap).map(m => ({
      month: m,
      attendanceRate: Math.round((monthlyMap[m].present / monthlyMap[m].total) * 100)
    }));

    // Batch Comparison
    const batches = await Batch.find({});
    const batchComparison = await Promise.all(batches.map(async b => {
      const batchInterns = interns.filter(i => i.batchId?.toString() === b._id.toString());
      if (batchInterns.length === 0) return null;
      const rateSum = batchInterns.reduce((sum, i) => sum + i.attendancePercentage, 0);
      return {
        batchName: b.name,
        attendanceRate: Math.round(rateSum / batchInterns.length)
      };
    }));

    // Track Comparison
    const tracks = ["Frontend", "Backend", "UI/UX", "Marketing"];
    const trackComparison = tracks.map(t => {
      const trackInterns = interns.filter(i => i.track === t);
      if (trackInterns.length === 0) return null;
      const rateSum = trackInterns.reduce((sum, i) => sum + i.attendancePercentage, 0);
      return {
        track: t,
        attendanceRate: Math.round(rateSum / trackInterns.length)
      };
    });

    res.status(200).json({
      overallStats: { present, absent, late, leave, total, attendanceRate },
      dailyAttendance,
      monthlyTrends,
      batchComparison: batchComparison.filter(Boolean),
      trackComparison: trackComparison.filter(Boolean)
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/analytics/task-chart
export const getTaskChart = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interns = await getFilteredInterns(req);
    const internUserIds = interns.map(i => i.userId?._id || i.userId);

    const { startDate, endDate } = req.query;
    const dateMatch: any = {};
    if (startDate || endDate) {
      if (startDate) dateMatch.$gte = new Date(startDate as string);
      if (endDate) dateMatch.$lte = new Date(endDate as string);
    }

    const taskQuery: any = { assignedTo: { $in: internUserIds } };
    if (Object.keys(dateMatch).length > 0) {
      taskQuery.createdAt = dateMatch;
    }

    const tasks = await Task.find(taskQuery);

    let notStarted = 0;
    let inProgress = 0;
    let underReview = 0;
    let done = 0;
    let high = 0;
    let medium = 0;
    let low = 0;

    tasks.forEach(t => {
      if (t.status === "Not Started") notStarted++;
      else if (t.status === "In Progress") inProgress++;
      else if (t.status === "Under Review") underReview++;
      else if (t.status === "Done") done++;

      if (t.priority === "high") high++;
      else if (t.priority === "medium") medium++;
      else if (t.priority === "low") low++;
    });

    const total = tasks.length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    // Monthly trends of completed tasks
    const monthlyMap: Record<string, { total: number; completed: number }> = {};
    tasks.forEach(t => {
      const monthStr = t.createdAt.toLocaleString("default", { month: "short", year: "2-digit" });
      if (!monthlyMap[monthStr]) {
        monthlyMap[monthStr] = { total: 0, completed: 0 };
      }
      monthlyMap[monthStr].total++;
      if (t.status === "Done") {
        monthlyMap[monthStr].completed++;
      }
    });

    const monthlyTrends = Object.keys(monthlyMap).map(m => ({
      month: m,
      completionRate: Math.round((monthlyMap[m].completed / monthlyMap[m].total) * 100),
      completedCount: monthlyMap[m].completed
    }));

    // Batch Comparison
    const batches = await Batch.find({});
    const batchComparison = await Promise.all(batches.map(async b => {
      const batchInterns = interns.filter(i => i.batchId?.toString() === b._id.toString());
      if (batchInterns.length === 0) return null;
      const rateSum = batchInterns.reduce((sum, i) => sum + i.taskCompletionPercentage, 0);
      return {
        batchName: b.name,
        completionRate: Math.round(rateSum / batchInterns.length)
      };
    }));

    // Track Comparison
    const tracks = ["Frontend", "Backend", "UI/UX", "Marketing"];
    const trackComparison = tracks.map(t => {
      const trackInterns = interns.filter(i => i.track === t);
      if (trackInterns.length === 0) return null;
      const rateSum = trackInterns.reduce((sum, i) => sum + i.taskCompletionPercentage, 0);
      return {
        track: t,
        completionRate: Math.round(rateSum / trackInterns.length)
      };
    });

    res.status(200).json({
      overallStats: { notStarted, inProgress, underReview, done, total, completionRate },
      priorityDistribution: { high, medium, low },
      monthlyTrends,
      batchComparison: batchComparison.filter(Boolean),
      trackComparison: trackComparison.filter(Boolean)
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/analytics/standup-trend
export const getStandupTrend = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interns = await getFilteredInterns(req);
    const internUserIds = interns.map(i => i.userId?._id || i.userId);

    const { startDate, endDate } = req.query;
    const dateMatch: any = {};
    if (startDate || endDate) {
      if (startDate) dateMatch.$gte = new Date(startDate as string);
      if (endDate) dateMatch.$lte = new Date(endDate as string);
    }

    const standupQuery: any = { internId: { $in: internUserIds } };
    if (Object.keys(dateMatch).length > 0) {
      standupQuery.date = dateMatch;
    }

    const standups = await Standup.find(standupQuery).sort({ date: 1 });

    const dailyMap: Record<string, { count: number; sumCompletion: number }> = {};
    const moodMap: Record<string, number> = {};

    standups.forEach(s => {
      const dateStr = s.date.toISOString().slice(0, 10);
      if (!dailyMap[dateStr]) {
        dailyMap[dateStr] = { count: 0, sumCompletion: 0 };
      }
      dailyMap[dateStr].count++;
      dailyMap[dateStr].sumCompletion += s.completionPercentage || 0;

      moodMap[s.mood] = (moodMap[s.mood] || 0) + 1;
    });

    const dailyTrend = Object.keys(dailyMap).map(d => ({
      date: d,
      count: dailyMap[d].count,
      averageCompletion: Math.round(dailyMap[d].sumCompletion / dailyMap[d].count)
    }));

    res.status(200).json({
      overallStats: {
        submittedCount: standups.length,
        averageCompletion: standups.length > 0 ? Math.round(standups.reduce((sum, s) => sum + s.completionPercentage, 0) / standups.length) : 0
      },
      dailyTrend,
      moodDistribution: moodMap
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/analytics/leaderboard
export const getLeaderboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const interns = await Intern.find({ status: "active" })
      .populate("userId", "name email avatar")
      .populate("batchId", "name");

    const leaderboard = interns.map(i => {
      const taskComp = i.taskCompletionPercentage || 0;
      const attRate = i.attendancePercentage || 0;
      const lmsProg = i.lmsProgress || 0;
      
      // Formula: 0.4 * tasksCompleted% + 0.3 * attendance% + 0.3 * lmsProgress%
      const score = Math.round((0.4 * taskComp) + (0.3 * attRate) + (0.3 * lmsProg));

      return {
        internId: i._id,
        name: (i.userId as any)?.name || "Unknown Intern",
        email: (i.userId as any)?.email || "",
        avatar: i.avatar || (i.userId as any)?.avatar || "II",
        batch: (i.batchId as any)?.name || "N/A",
        track: i.track,
        taskCompletionPercentage: taskComp,
        attendancePercentage: attRate,
        lmsProgress: lmsProg,
        performanceScore: i.performance || 80,
        score
      };
    }).sort((a, b) => b.score - a.score);

    res.status(200).json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/dashboard
export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    const totalInternsCount = await Intern.countDocuments({});
    const activeInternsCount = await Intern.countDocuments({ status: "active" });

    // Today's Standups
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const todayStandupsCount = await Standup.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd }
    });

    // Attendance Percentage (Average of active interns)
    const activeInterns = await Intern.find({ status: "active" });
    const attendancePercentage = activeInterns.length > 0
      ? Math.round(activeInterns.reduce((sum, i) => sum + i.attendancePercentage, 0) / activeInterns.length)
      : 100;

    const pendingLeaveCount = await LeaveRequest.countDocuments({ status: "Pending" });

    const overdueTasksCount = await Task.countDocuments({
      status: { $ne: "Done" },
      dueDate: { $lt: new Date() }
    });

    const notificationsCount = await Notification.countDocuments({
      recipientId: req.user.id,
      read: false
    });

    // Recent Activity Feed
    const recentActivityFeed = await ActivityLog.find({})
      .sort({ timestamp: -1 })
      .limit(10);

    res.status(200).json({
      totalInterns: totalInternsCount,
      activeInterns: activeInternsCount,
      todaysStandups: todayStandupsCount,
      attendancePercentage,
      pendingLeaveRequests: pendingLeaveCount,
      overdueTasks: overdueTasksCount,
      notificationsCount,
      recentActivityFeed
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// GET /api/analytics/export
export const exportCSV = async (req: AuthRequest, res: Response): Promise<void> => {
  const { type = "attendance" } = req.query;

  try {
    let csvContent = "";
    let filename = `export_${type}_${Date.now()}.csv`;

    const interns = await getFilteredInterns(req);
    const internUserIds = interns.map(i => i.userId?._id || i.userId);

    const { startDate, endDate } = req.query;
    const dateMatch: any = {};
    if (startDate || endDate) {
      if (startDate) dateMatch.$gte = new Date(startDate as string);
      if (endDate) dateMatch.$lte = new Date(endDate as string);
    }

    if (type === "attendance") {
      const attendanceQuery: any = { internId: { $in: internUserIds } };
      if (Object.keys(dateMatch).length > 0) {
        attendanceQuery.date = dateMatch;
      }
      const records = await Attendance.find(attendanceQuery)
        .populate("internId", "name email")
        .sort({ date: -1 });

      csvContent = "Intern Name,Email,Date,Status,Check-In,Check-Out,Total Hours\n";
      records.forEach(r => {
        const name = (r.internId as any)?.name || "Unknown";
        const email = (r.internId as any)?.email || "N/A";
        const dateStr = r.date.toISOString().slice(0, 10);
        const checkInStr = r.checkIn ? r.checkIn.toISOString() : "";
        const checkOutStr = r.checkOut ? r.checkOut.toISOString() : "";
        csvContent += `"${name}","${email}","${dateStr}","${r.status}","${checkInStr}","${checkOutStr}",${r.totalHours}\n`;
      });

    } else if (type === "tasks") {
      const taskQuery: any = { assignedTo: { $in: internUserIds } };
      if (Object.keys(dateMatch).length > 0) {
        taskQuery.createdAt = dateMatch;
      }
      const records = await Task.find(taskQuery)
        .populate("assignedTo", "name email")
        .sort({ createdAt: -1 });

      csvContent = "Task Title,Assigned To Name,Assigned To Email,Priority,Status,Due Date,Module,Created At\n";
      records.forEach(t => {
        const name = (t.assignedTo as any)?.name || "Unknown";
        const email = (t.assignedTo as any)?.email || "N/A";
        const dueDateStr = t.dueDate ? t.dueDate.toISOString().slice(0, 10) : "";
        const createdAtStr = t.createdAt ? t.createdAt.toISOString().slice(0, 10) : "";
        csvContent += `"${t.title.replace(/"/g, '""')}","${name}","${email}","${t.priority}","${t.status}","${dueDateStr}","${t.module}","${createdAtStr}"\n`;
      });

    } else if (type === "standups") {
      const standupQuery: any = { internId: { $in: internUserIds } };
      if (Object.keys(dateMatch).length > 0) {
        standupQuery.date = dateMatch;
      }
      const records = await Standup.find(standupQuery)
        .populate("internId", "name email")
        .sort({ date: -1 });

      csvContent = "Intern Name,Email,Date,Yesterday's Work,Today's Plan,Blockers,Mood,Completion Percentage,Submitted At\n";
      records.forEach(s => {
        const name = (s.internId as any)?.name || "Unknown";
        const email = (s.internId as any)?.email || "N/A";
        const dateStr = s.date.toISOString().slice(0, 10);
        const yestWork = s.yesterdayWork ? s.yesterdayWork.replace(/"/g, '""') : "";
        const todayPlan = s.todayPlan ? s.todayPlan.replace(/"/g, '""') : "";
        const blockers = s.blockers ? s.blockers.replace(/"/g, '""') : "";
        const submittedAtStr = s.submittedAt ? s.submittedAt.toISOString() : "";
        csvContent += `"${name}","${email}","${dateStr}","${yestWork}","${todayPlan}","${blockers}","${s.mood}",${s.completionPercentage},"${submittedAtStr}"\n`;
      });

    } else if (type === "leaderboard") {
      const internsList = await Intern.find({ status: "active" })
        .populate("userId", "name email")
        .populate("batchId", "name");

      const ranks = internsList.map(i => {
        const taskComp = i.taskCompletionPercentage || 0;
        const attRate = i.attendancePercentage || 0;
        const lmsProg = i.lmsProgress || 0;
        const score = Math.round((0.4 * taskComp) + (0.3 * attRate) + (0.3 * lmsProg));
        return {
          name: (i.userId as any)?.name || "Unknown",
          email: (i.userId as any)?.email || "",
          batch: (i.batchId as any)?.name || "N/A",
          track: i.track,
          taskCompletionPercentage: taskComp,
          attendancePercentage: attRate,
          lmsProgress: lmsProg,
          performanceScore: i.performance || 80,
          score
        };
      }).sort((a, b) => b.score - a.score);

      csvContent = "Rank,Intern Name,Email,Batch,Track,Task Completion %,Attendance %,LMS Progress %,Performance Score,Weighted Score\n";
      ranks.forEach((r, idx) => {
        csvContent += `${idx + 1},"${r.name}","${r.email}","${r.batch}","${r.track}",${r.taskCompletionPercentage},${r.attendancePercentage},${r.lmsProgress},${r.performanceScore},${r.score}\n`;
      });

    } else {
      res.status(400).json({ message: "Invalid CSV export type requested." });
      return;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.status(200).send(csvContent);
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
