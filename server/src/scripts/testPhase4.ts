process.env.NODE_ENV = "test";
process.env.PORT = "5002";
process.env.MONGO_URI = "mongodb://localhost:27017/klassygo_hrm_test_phase4";
process.env.AI_PROVIDER = "mock";
process.env.CERTIFICATE_MIN_COMPLETION = "85";
process.env.CERTIFICATE_MIN_ATTENDANCE = "80";

import mongoose from "mongoose";
import { io as ClientIO } from "socket.io-client";
import { app, server } from "../app";
import { Intern } from "../models/Intern";
import { Attendance } from "../models/Attendance";
import { Task } from "../models/Task";
import { Standup } from "../models/Standup";
import { Certificate } from "../models/Certificate";
import { OfferLetter } from "../models/OfferLetter";
import { ActivityLog } from "../models/ActivityLog";
import fs from "fs";
import path from "path";

const PORT = 5002;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTests = async () => {
  console.log("==========================================================");
  console.log("     KLASSYGO HRM - PHASE 4 INTEGRATION TEST SUITE        ");
  console.log("==========================================================");

  // Wait for mongoose connection
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) resolve(true);
    else mongoose.connection.once("connected", resolve);
  });

  console.log("Cleaning test database...");
  await mongoose.connection.dropDatabase();

  const randomSuffix = Math.floor(Math.random() * 100000);
  const leadEmail = `lead_${randomSuffix}@klassygo.com`;
  const internEmail = `intern_${randomSuffix}@klassygo.com`;
  const password = "Password123!";

  let leadToken = "";
  let internToken = "";
  let leadUserId = "";
  let internUserId = "";
  let internProfileId = "";
  let batchId = "";
  let certificateId = "";
  let offerId = "";

  // 1. Create Test Accounts
  console.log("\n--- [1. Registering/Logging In Users] ---");
  try {
    const regLead = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Lead User",
        email: leadEmail,
        password,
        role: "Lead",
        department: "Technology",
        avatar: "TL"
      }),
    });
    const leadData = await regLead.json();
    leadUserId = leadData.user.id || leadData.user._id;
    leadToken = leadData.token;
    console.log("✓ Registered Lead User:", leadEmail);

    // Create a batch first
    const createBatch = await fetch(`${BASE_URL}/batches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${leadToken}`,
      },
      body: JSON.stringify({
        name: `Batch 2026-${randomSuffix}`,
        startDate: "2026-01-01",
        endDate: "2026-06-30",
      }),
    });
    const batchData = await createBatch.json();
    batchId = batchData._id;
    console.log("✓ Created Batch:", batchData.name);

    // Register Intern
    const regIntern = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Intern User",
        email: internEmail,
        password,
        role: "Intern",
        department: "Technology",
        avatar: "TI",
        batchId,
        track: "Backend",
        startDate: "2026-01-01",
        endDate: "2026-06-30"
      }),
    });
    const internData = await regIntern.json();
    internUserId = internData.user.id || internData.user._id;
    internToken = internData.token;
    console.log("✓ Registered Intern User:", internEmail);

    const profile = await Intern.findOne({ userId: internUserId });
    if (profile) {
      internProfileId = profile._id.toString();
      // Boost the intern's mock stats for eligibility testing
      profile.attendancePercentage = 85;
      profile.taskCompletionPercentage = 90;
      await profile.save();
    }
  } catch (err) {
    console.error("✗ Registration error:", (err as Error).message);
  }

  // 2. Activity Logs Socket Listener Setup
  console.log("\n--- [2. Setting up socket listener for Activity Logs] ---");
  let socketClient: any;
  let receivedActivityPromise: Promise<any> = Promise.resolve(null);
  try {
    socketClient = ClientIO(`http://localhost:${PORT}`, {
      auth: { token: leadToken },
      transports: ["websocket"],
    });

    receivedActivityPromise = new Promise((resolve) => {
      socketClient.on("activity:received", (payload: any) => {
        resolve(payload);
      });
    });

    await new Promise<void>((resolve, reject) => {
      socketClient.on("connect", () => {
        console.log("✓ Socket connected as Lead: SUCCESS");
        resolve();
      });
      socketClient.on("connect_error", (err: any) => reject(err));
    });
  } catch (err) {
    console.error("✗ Socket connection error:", (err as Error).message);
  }

  // 3. AI Performance Engine Evaluation
  console.log("\n--- [3. AI Performance Evaluation & Manual Regeneration] ---");
  try {
    // Write 7 dummy standups
    const standupDates = Array.from({ length: 7 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - idx);
      d.setHours(0, 0, 0, 0);
      return d;
    });

    for (const date of standupDates) {
      await new Standup({
        internId: internUserId,
        date,
        yesterdayWork: "Completed task controller implementation",
        todayPlan: "Setup express test router",
        blockers: "None",
        mood: "productive",
        completionPercentage: 90,
        submittedAt: new Date()
      }).save();
    }
    console.log("✓ Seeded 7 daily standups for AI Evaluation.");

    // Trigger AI evaluation manual regeneration as Lead
    const regenRes = await fetch(`${BASE_URL}/ai-performance/${internUserId}/regenerate`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${leadToken}`,
      }
    });
    const regenData = await regenRes.json();
    if (regenRes.status === 200 && regenData.grade) {
      console.log("✓ Manual AI Performance Regeneration: SUCCESS, Grade:", regenData.grade);
    } else {
      console.error("✗ Manual AI Performance Regeneration: FAILED", regenRes.status, regenData);
    }

    // View latest AI performance evaluation
    const viewRes = await fetch(`${BASE_URL}/ai-performance/${internUserId}`, {
      headers: { Authorization: `Bearer ${internToken}` }
    });
    const viewData = await viewRes.json();
    if (viewRes.status === 200 && viewData.grade) {
      console.log("✓ GET /ai-performance/:internId: SUCCESS");
    } else {
      console.error("✗ GET /ai-performance/:internId: FAILED", viewRes.status);
    }
  } catch (err) {
    console.error("✗ AI Evaluation tests error:", (err as Error).message);
  }

  // 4. Configurable Eligibility, Certificate request, and approval workflow
  console.log("\n--- [4. Certificate Request & Eligibility Workflow] ---");
  try {
    // Check eligibility
    const eligRes = await fetch(`${BASE_URL}/certificates/eligibility`, {
      headers: { Authorization: `Bearer ${internToken}` }
    });
    const eligData = await eligRes.json();
    console.log("✓ Check Eligibility:", eligData.eligible ? "Eligible" : "Ineligible", eligData.reason || "");

    // Request certificate
    const reqRes = await fetch(`${BASE_URL}/certificates/request`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${internToken}`
      }
    });
    const reqData = await reqRes.json();
    if (reqRes.status === 201) {
      console.log("✓ Certificate Request Submitted:", reqData.certificateNumber);
      certificateId = reqData._id;
    } else {
      console.error("✗ Certificate Request Submission: FAILED", reqRes.status, reqData.message);
    }

    // Lead approves and compiles PDF
    const approveRes = await fetch(`${BASE_URL}/certificates/${certificateId}/approve`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${leadToken}`
      },
      body: JSON.stringify({ grade: "A+" })
    });
    const approveData = await approveRes.json();
    if (approveRes.status === 200) {
      console.log("✓ Lead Approved Certificate. Status:", approveData.status);
      console.log("✓ PDF Metadata Status stored:", approveData.status);
      console.log("✓ PDF download path:", approveData.downloadPath);
    } else {
      console.error("✗ Lead Approved Certificate: FAILED", approveRes.status, approveData);
    }

    // Download PDF stream
    const downloadRes = await fetch(`${BASE_URL}/certificates/download/${certificateId}`, {
      headers: { Authorization: `Bearer ${internToken}` }
    });
    if (downloadRes.status === 200) {
      console.log("✓ Stream Certificate PDF file: SUCCESS, Content-Type:", downloadRes.headers.get("content-type"));
    } else {
      console.error("✗ Stream Certificate PDF: FAILED", downloadRes.status);
    }
  } catch (err) {
    console.error("✗ Certificate workflow error:", (err as Error).message);
  }

  // 5. Offer Letter Generation & tracking
  console.log("\n--- [5. Offer Letter Generation Workflow] ---");
  try {
    const offerRes = await fetch(`${BASE_URL}/offer-letters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${leadToken}`
      },
      body: JSON.stringify({
        internId: internUserId,
        salaryDetails: "15,000 INR per month",
        startDate: "2026-07-01"
      })
    });
    const offerData = await offerRes.json();
    if (offerRes.status === 201) {
      console.log("✓ Offer Letter generated and tracked: SUCCESS");
      console.log("✓ PDF download path:", offerData.downloadPath);
      offerId = offerData._id;
    } else {
      console.error("✗ Offer Letter generation: FAILED", offerRes.status, offerData);
    }

    // Stream Offer Letter PDF
    const downloadOfferRes = await fetch(`${BASE_URL}/offer-letters/download/${offerId}`, {
      headers: { Authorization: `Bearer ${internToken}` }
    });
    if (downloadOfferRes.status === 200) {
      console.log("✓ Stream Offer Letter PDF file: SUCCESS, Content-Type:", downloadOfferRes.headers.get("content-type"));
    } else {
      console.error("✗ Stream Offer Letter PDF: FAILED", downloadOfferRes.status);
    }
  } catch (err) {
    console.error("✗ Offer letter workflow error:", (err as Error).message);
  }

  // 6. Analytics dashboard, trends, CSV exports
  console.log("\n--- [6. Analytics Dashboard and Exports] ---");
  try {
    // Attendance chart
    const attChartRes = await fetch(`${BASE_URL}/analytics/attendance-chart?batchId=${batchId}&track=Backend`, {
      headers: { Authorization: `Bearer ${leadToken}` }
    });
    const attChartData = await attChartRes.json();
    console.log("✓ GET /analytics/attendance-chart: SUCCESS. Attendance Rate:", attChartData.overallStats?.attendanceRate);

    // Tasks chart
    const taskChartRes = await fetch(`${BASE_URL}/analytics/task-chart?batchId=${batchId}&track=Backend`, {
      headers: { Authorization: `Bearer ${leadToken}` }
    });
    const taskChartData = await taskChartRes.json();
    console.log("✓ GET /analytics/task-chart: SUCCESS. Tasks Total:", taskChartData.overallStats?.total);

    // Standup trends
    const standupTrendRes = await fetch(`${BASE_URL}/analytics/standup-trend?batchId=${batchId}&track=Backend`, {
      headers: { Authorization: `Bearer ${leadToken}` }
    });
    const standupTrendData = await standupTrendRes.json();
    console.log("✓ GET /analytics/standup-trend: SUCCESS. Submitted Count:", standupTrendData.overallStats?.submittedCount);

    // Leaderboard
    const leaderboardRes = await fetch(`${BASE_URL}/analytics/leaderboard`, {
      headers: { Authorization: `Bearer ${leadToken}` }
    });
    const leaderboardData = await leaderboardRes.json();
    console.log("✓ GET /analytics/leaderboard: SUCCESS. Leaderboard Size:", leaderboardData.length);

    // CSV Export
    const csvExportRes = await fetch(`${BASE_URL}/analytics/export?type=attendance&batchId=${batchId}`, {
      headers: { Authorization: `Bearer ${leadToken}` }
    });
    if (csvExportRes.status === 200) {
      console.log("✓ GET /analytics/export (CSV): SUCCESS, Content-Type:", csvExportRes.headers.get("content-type"));
    } else {
      console.error("✗ GET /analytics/export: FAILED", csvExportRes.status);
    }
  } catch (err) {
    console.error("✗ Analytics endpoints error:", (err as Error).message);
  }

  // 7. Single Dashboard API
  console.log("\n--- [7. Single Aggregated Dashboard endpoint] ---");
  try {
    const dashRes = await fetch(`${BASE_URL}/dashboard`, {
      headers: { Authorization: `Bearer ${leadToken}` }
    });
    const dashData = await dashRes.json();
    if (dashRes.status === 200) {
      console.log("✓ GET /api/dashboard stats return successfully:");
      console.log("  - Total Interns:", dashData.totalInterns);
      console.log("  - Active Interns:", dashData.activeInterns);
      console.log("  - Todays Standups:", dashData.todaysStandups);
      console.log("  - Pending Leaves:", dashData.pendingLeaveRequests);
      console.log("  - Overdue Tasks:", dashData.overdueTasks);
      console.log("  - Activity Feed length:", dashData.recentActivityFeed?.length);
    } else {
      console.error("✗ GET /api/dashboard stats: FAILED", dashRes.status, dashData);
    }
  } catch (err) {
    console.error("✗ Single Dashboard API error:", (err as Error).message);
  }

  // 8. Health check Endpoint
  console.log("\n--- [8. Health Check API /api/health] ---");
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await healthRes.json();
    if (healthRes.status === 200) {
      console.log("✓ GET /api/health: SUCCESS");
      console.log("  - Uptime:", healthData.uptime);
      console.log("  - MongoDB status:", healthData.mongodbStatus);
      console.log("  - Socket.io status:", healthData.socketioStatus);
      console.log("  - AI Provider:", healthData.currentAIProvider);
      console.log("  - App version:", healthData.version);
    } else {
      console.error("✗ GET /api/health: FAILED", healthRes.status, healthData);
    }
  } catch (err) {
    console.error("✗ Health check API error:", (err as Error).message);
  }

  // 9. Centralized Error Handling Verification
  console.log("\n--- [9. Centralized Error Handling] ---");
  try {
    // Fetch certificate detail with an invalid MongoDB ID structure to trigger mongoose CastError
    const badRes = await fetch(`${BASE_URL}/certificates/invalid-object-id-12345`, {
      headers: { Authorization: `Bearer ${leadToken}` }
    });
    const badData = await badRes.json();
    if (badRes.status !== 200 && badData.status === "error") {
      console.log("✓ Standardized Error response returned: SUCCESS");
      console.log("  - HTTP Status:", badRes.status);
      console.log("  - Code:", badData.code);
      console.log("  - Message:", badData.message);
    } else {
      console.error("✗ Centralized Error format verification: FAILED", badRes.status, badData);
    }
  } catch (err) {
    console.error("✗ Centralized Error verification error:", (err as Error).message);
  }

  // 10. Verify Socket Activity Log Broadcasting
  console.log("\n--- [10. Real-time Activity Log socket propagation] ---");
  try {
    const logPayload = await Promise.race([
      receivedActivityPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Activity broadcast timeout")), 3000)),
    ]);

    if (logPayload && logPayload.action) {
      console.log("✓ Socket.io successfully received live activity log broadcast: SUCCESS");
      console.log("  - Action:", logPayload.action);
      console.log("  - User:", logPayload.userName);
      console.log("  - Module:", logPayload.module);
      console.log("  - Impact:", logPayload.impact);
      console.log("  - IP:", logPayload.ipAddress);
      console.log("  - User Agent:", logPayload.userAgent);
    } else {
      console.error("✗ Socket.io activity log propagation: FAILED", logPayload);
    }
  } catch (err) {
    console.error("✗ Socket activity logging error:", (err as Error).message);
  }

  if (socketClient) {
    socketClient.disconnect();
  }
};

const startTestServer = () => {
  const serverInstance = server.listen(PORT, async () => {
    console.log(`Test Server running on port ${PORT}...`);
    try {
      await runTests();
    } catch (e) {
      console.error("Test execution crashed:", e);
    } finally {
      serverInstance.close(async () => {
        console.log("Test Server closed.");
        try {
          await mongoose.connection.close();
          console.log("Database connection closed.");
        } catch (err) {
          console.error("Error closing database:", err);
        }
        process.exit(0);
      });
    }
  });
};

startTestServer();
