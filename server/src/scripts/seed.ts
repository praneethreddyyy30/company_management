import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Import models
import { User } from "../models/User";
import { Intern } from "../models/Intern";
import { Batch } from "../models/Batch";
import { Task } from "../models/Task";
import { LeaveRequest } from "../models/LeaveRequest";
import { Announcement } from "../models/Announcement";
import { Notification } from "../models/Notification";
import { Standup } from "../models/Standup";
import { Attendance } from "../models/Attendance";
import { Certificate } from "../models/Certificate";
import { OfferLetter } from "../models/OfferLetter";
import { ActivityLog } from "../models/ActivityLog";
import { Candidate } from "../models/Candidate";
import { Policy } from "../models/Policy";
import { Evaluation } from "../models/Evaluation";

// Import services for file generation
import { generateCertificatePDF, generateOfferLetterPDF } from "../services/pdfService";

dotenv.config();

const seedDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/klassygo_hrm";
    console.log(`[Seeder] Connecting to MongoDB: ${mongoUri.replace(/:([^:@]+)@/, ":***@")}`);
    await mongoose.connect(mongoUri);

    // Clear existing data
    await User.deleteMany({});
    await Intern.deleteMany({});
    await Batch.deleteMany({});
    await Task.deleteMany({});
    await LeaveRequest.deleteMany({});
    await Announcement.deleteMany({});
    await Notification.deleteMany({});
    await Standup.deleteMany({});
    await Attendance.deleteMany({});
    await Certificate.deleteMany({});
    await OfferLetter.deleteMany({});
    await ActivityLog.deleteMany({});
    await Candidate.deleteMany({});
    await Policy.deleteMany({});
    await Evaluation.deleteMany({});
    console.log("[Seeder] Cleared all database collections.");

    // Hash default password
    const hashedPassword = await bcrypt.hash("password123", 10);

    // 1. CREATE LEAD USERS
    const leadUser = new User({
      name: "Vikram Iyer",
      email: "lead@klassygo.com", // Dedicated lead login
      password: hashedPassword,
      role: "Lead",
      department: "Technology",
      avatar: "VI",
      joinedAt: new Date("2024-01-15")
    });
    await leadUser.save();

    const hrLead = new User({
      name: "Priya Sharma",
      email: "priya@klassygo.com",
      password: hashedPassword,
      role: "Lead",
      department: "Human Resources",
      avatar: "PS",
      joinedAt: new Date("2024-08-12")
    });
    await hrLead.save();

    console.log("[Seeder] Created Lead accounts: lead@klassygo.com, priya@klassygo.com");

    // 2. CREATE BATCHES
    const batch = new Batch({
      name: "Winter 2026 Batch",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      mentorId: leadUser._id,
      isActive: true
    });
    await batch.save();
    console.log(`[Seeder] Created Batch: "${batch.name}"`);

    // 3. CREATE INTERNS
    // Intern 1: Active Intern with incomplete onboarding (for testing onboarding workflow)
    const activeUser = new User({
      name: "Sneha Reddy",
      email: "intern@klassygo.com", // Dedicated active intern login
      password: hashedPassword,
      role: "Intern",
      department: "Technology",
      avatar: "SR",
      joinedAt: new Date("2026-01-01")
    });
    await activeUser.save();

    const activeIntern = new Intern({
      userId: activeUser._id,
      batchId: batch._id,
      track: "Frontend",
      mentor: "Vikram Iyer",
      status: "active",
      avatar: "SR",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      taskCompletionPercentage: 45,
      attendancePercentage: 88,
      performance: 82,
      lmsProgress: 60,
      tasksCompleted: 3,
      onboarding: {
        completed: false, // Incomplete onboarding
        checklist: {
          profileCompleted: false,
          guideRead: false,
          tasksReviewed: false,
          standupSubmitted: false, // Set to false to allow standup checkoff today
          attendanceMarked: false  // Set to false to allow check-in checkoff today
        }
      }
    });
    await activeIntern.save();

    // Intern 2: Completed Intern with certificate already issued
    const completedUser = new User({
      name: "Rohan Verma",
      email: "rohan@klassygo.com",
      password: hashedPassword,
      role: "Intern",
      department: "Technology",
      avatar: "RV",
      joinedAt: new Date("2025-07-01")
    });
    await completedUser.save();

    const completedIntern = new Intern({
      userId: completedUser._id,
      batchId: batch._id,
      track: "Backend",
      mentor: "Vikram Iyer",
      status: "completed",
      avatar: "RV",
      startDate: new Date("2025-07-01"),
      endDate: new Date("2025-12-31"),
      taskCompletionPercentage: 100,
      attendancePercentage: 96,
      performance: 92,
      lmsProgress: 100,
      tasksCompleted: 12,
      onboarding: {
        completed: true,
        checklist: {
          profileCompleted: true,
          guideRead: true,
          tasksReviewed: true,
          standupSubmitted: true,
          attendanceMarked: true
        }
      }
    });
    await completedIntern.save();

    console.log("[Seeder] Seeded Intern profiles: intern@klassygo.com (active), rohan@klassygo.com (completed)");

    // 4. SEED TASKS
    const tasksData = [
      { title: "Implement Auth Middleware", assignedTo: activeUser._id, priority: "high", status: "Done", dueDate: new Date("2026-05-15"), module: "Engineering" },
      { title: "Configure Rate Limiters", assignedTo: activeUser._id, priority: "high", status: "In Progress", dueDate: new Date("2026-06-30"), module: "Engineering" },
      { title: "Generate PDF Reports", assignedTo: activeUser._id, priority: "medium", status: "Not Started", dueDate: new Date("2026-07-05"), module: "Engineering" },
      { title: "Review LMS Curriculum", assignedTo: completedUser._id, priority: "low", status: "Done", dueDate: new Date("2025-11-20"), module: "HR" }
    ];

    for (const t of tasksData) {
      const task = new Task(t);
      await task.save();
    }
    console.log("[Seeder] Seeded Tasks.");

    // 5. SEED DAILY STANDUPS
    // We seed 6 past days of standups for Sneha Reddy, so that once she submits her 7th today,
    // she will have exactly 7 standups, enabling AI Performance calculations!
    for (let i = 1; i <= 6; i++) {
      const standupDate = new Date();
      standupDate.setDate(standupDate.getDate() - i);
      standupDate.setHours(0, 0, 0, 0);

      const standup = new Standup({
        internId: activeUser._id,
        date: standupDate,
        yesterdayWork: `Completed sprint checklist part ${7 - i}.`,
        todayPlan: `Wired up API connections for step ${8 - i}.`,
        blockers: "None",
        mood: "productive",
        completionPercentage: 10 + i * 5,
        submittedAt: new Date(standupDate.getTime() + 10 * 60 * 60 * 1000) // Submitted at 10 AM
      });
      await standup.save();
    }
    console.log("[Seeder] Seeded 6 past standups for intern@klassygo.com.");

    // 6. SEED ATTENDANCE HEATMAP
    // Seed 20 past attendance records to make the GitHub heatmap populate beautifully
    for (let i = 1; i <= 20; i++) {
      const attendanceDate = new Date();
      attendanceDate.setDate(attendanceDate.getDate() - i);
      
      // Skip weekends
      if (attendanceDate.getDay() === 0 || attendanceDate.getDay() === 6) continue;

      attendanceDate.setHours(0, 0, 0, 0);

      const checkInTime = new Date(attendanceDate);
      checkInTime.setHours(9, 45 + (i % 10)); // ~9:45 AM - 9:55 AM (On Time)

      const checkOutTime = new Date(attendanceDate);
      checkOutTime.setHours(18, 0); // 6:00 PM

      const attendance = new Attendance({
        internId: activeUser._id,
        date: attendanceDate,
        checkIn: checkInTime,
        checkOut: checkOutTime,
        status: i % 15 === 0 ? "Late" : "Present",
        totalHours: 8.25
      });
      await attendance.save();
    }
    console.log("[Seeder] Seeded 20 days of past attendance heatmap records.");

    // 7. SEED LEAVE REQUESTS
    const leaveRequests = [
      { employeeId: activeUser._id, employeeName: "Sneha Reddy", type: "sick", fromDate: new Date("2026-04-10"), toDate: new Date("2026-04-11"), days: 2, reason: "Dental treatment", status: "Approved", appliedAt: new Date("2026-04-08"), approvedBy: leadUser._id },
      { employeeId: activeUser._id, employeeName: "Sneha Reddy", type: "casual", fromDate: new Date("2026-07-10"), toDate: new Date("2026-07-12"), days: 3, reason: "Family event", status: "Pending", appliedAt: new Date("2026-06-20") },
      { employeeId: activeUser._id, employeeName: "Sneha Reddy", type: "earned", fromDate: new Date("2026-03-05"), toDate: new Date("2026-03-05"), days: 1, reason: "Personal work", status: "Rejected", appliedAt: new Date("2026-03-01") }
    ];

    for (const lr of leaveRequests) {
      const leave = new LeaveRequest(lr);
      await leave.save();
    }
    console.log("[Seeder] Seeded Leave Requests.");

    // 8. SEED ANNOUNCEMENTS & NOTIFICATIONS
    const announcement = new Announcement({
      title: "KLASSYGO Winter Cohort Kickoff",
      content: "Welcome all new interns starting this week! We are excited to have you onboard for the Winter 2026 cohort. Please make sure to complete your onboarding checklist.",
      authorId: leadUser._id,
      authorName: "Vikram Iyer",
      priority: "high"
    });
    await announcement.save();

    const notif1 = new Notification({
      recipientId: activeUser._id,
      title: "Welcome to KLASSYGO!",
      message: "Please complete your onboarding checklist to get started.",
      type: "info",
      module: "Onboarding",
      read: false
    });
    await notif1.save();

    const notif2 = new Notification({
      recipientId: leadUser._id,
      title: "New Leave Application",
      message: "Sneha Reddy applied for Casual Leave.",
      type: "warning",
      module: "Leaves",
      read: false
    });
    await notif2.save();

    console.log("[Seeder] Seeded Announcements and Notifications.");

    // 9. SEED CERTIFICATES (AND PRE-GENERATE THE PDF FILE!)
    // Seed approved certificate for Rohan Verma
    const certApproved = new Certificate({
      internId: completedUser._id,
      certificateNumber: "KG-CERT-20251231-1002",
      status: "Approved",
      documentType: "Certificate",
      version: 1,
      requestDate: new Date("2025-12-25"),
      issuedAt: new Date("2025-12-31"),
      issuedBy: leadUser._id,
      grade: "A+",
    });
    await certApproved.save();

    // Ensure directory exists
    const uploadsDirCert = path.join(__dirname, "../../../uploads/certificates");
    if (!fs.existsSync(uploadsDirCert)) {
      fs.mkdirSync(uploadsDirCert, { recursive: true });
    }

    const fileNameCert = `cert-${certApproved._id}-${Date.now()}.pdf`;
    const certPath = path.join(uploadsDirCert, fileNameCert);

    await generateCertificatePDF(
      completedUser.name,
      "Backend",
      "A+",
      certApproved.certificateNumber,
      new Date("2025-12-31"),
      certPath
    );

    certApproved.downloadPath = `/api/certificates/download/${fileNameCert.split("-")[1]}`;
    await certApproved.save();

    // Seed pending certificate request for Sneha Reddy
    const certPending = new Certificate({
      internId: activeUser._id,
      certificateNumber: "KG-CERT-20260625-9988",
      status: "Pending",
      documentType: "Certificate",
      version: 1,
      requestDate: new Date(),
    });
    await certPending.save();

    console.log("[Seeder] Seeded Certificates and generated actual PDF file on disk.");

    // 10. SEED OFFER LETTERS (AND PRE-GENERATE THE PDF FILE!)
    const offerLetter = new OfferLetter({
      internId: activeUser._id,
      salaryDetails: "INR 25,000 per month stipend",
      startDate: new Date("2026-01-01"),
      status: "Generated",
      generatedBy: leadUser._id
    });

    // Ensure directory exists
    const uploadsDirOffer = path.join(__dirname, "../../../uploads/offer-letters");
    if (!fs.existsSync(uploadsDirOffer)) {
      fs.mkdirSync(uploadsDirOffer, { recursive: true });
    }

    const fileNameOffer = `offer-${offerLetter._id}-${Date.now()}.pdf`;
    const offerPath = path.join(uploadsDirOffer, fileNameOffer);

    await generateOfferLetterPDF(
      activeUser.name,
      "Frontend",
      "INR 25,000 per month stipend",
      new Date("2026-01-01"),
      offerPath
    );

    offerLetter.downloadPath = `/api/offer-letters/download/${fileNameOffer.split("-")[1]}`;
    await offerLetter.save();

    console.log("[Seeder] Seeded Offer Letters and generated actual PDF file on disk.");

    // 11. SEED ACTIVITY LOGS
    const log = new ActivityLog({
      userId: activeUser._id,
      userName: activeUser.name,
      action: "USER_LOGIN",
      details: "Logged in via Web Interface",
      module: "AUTH",
      impact: "LOW",
      ipAddress: "127.0.0.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    });
    await log.save();
    console.log("[Seeder] Seeded Activity Log.");

    // 12. SEED CANDIDATES
    const candidatesData = [
      { name: "Aarav Sen", role: "React Native Developer", stage: "screening", aiMatchScore: 89, resumeStrength: "Strong", interviewScheduled: false },
      { name: "Mira Patel", role: "UI/UX Designer", stage: "interview", aiMatchScore: 94, resumeStrength: "Outstanding", interviewScheduled: true },
      { name: "Kabir Mehta", role: "Node.js Backend Developer", stage: "applied", aiMatchScore: 78, resumeStrength: "Average", interviewScheduled: false }
    ];
    for (const c of candidatesData) {
      const candidate = new Candidate(c);
      await candidate.save();
    }
    console.log("[Seeder] Seeded Candidates.");

    // 13. SEED POLICIES
    const policiesData = [
      { title: "Intern Onboarding & Training Handbook", category: "Onboarding", version: "2.1.0", fileSize: "2.4 MB" },
      { title: "Workspace Security & Data Compliance Policy", category: "Security", version: "1.0.2", fileSize: "850 KB" }
    ];
    for (const p of policiesData) {
      const policy = new Policy(p);
      await policy.save();
    }
    console.log("[Seeder] Seeded Policies.");

    // 14. SEED EVALUATIONS
    const evaluationsData = [
      { internId: activeUser._id, evaluator: "Vikram Iyer", rating: 4, comment: "Excellent progress in the Frontend track. Demonstrates good grasp of React. Needs slight improvement in state management.", category: "Technical" },
      { internId: completedUser._id, evaluator: "Vikram Iyer", rating: 5, comment: "Outstanding performance. Rohan built clean modular backend APIs. Met all requirements and was a stellar peer helper.", category: "Technical" }
    ];
    for (const ev of evaluationsData) {
      const evaluation = new Evaluation(ev);
      await evaluation.save();
    }
    console.log("[Seeder] Seeded Evaluations.");

    console.log("\n[Seeder SUCCESS] Database Seeding Completed Successfully.");
    console.log("----------------------------------------------------------");
    console.log("Credentials for Testing:");
    console.log("  1. Lead Role:      lead@klassygo.com   /  password123");
    console.log("  2. Intern Role:    intern@klassygo.com /  password123");
    console.log("----------------------------------------------------------");
    process.exit(0);
  } catch (error) {
    console.error("[Seeder Error] Database seeding failed:", error);
    process.exit(1);
  }
};

seedDB();
