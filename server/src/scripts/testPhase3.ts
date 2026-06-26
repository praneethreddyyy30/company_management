// Setup test configurations before app imports or DB connection triggers
process.env.NODE_ENV = "test";
process.env.PORT = "5001";
process.env.MONGO_URI = "mongodb://localhost:27017/klassygo_hrm_test";
process.env.WORK_START_TIME = "10:00";
process.env.ABSENT_MARK_TIME = "11:00";
process.env.TIMEZONE = "Asia/Kolkata";

import mongoose from "mongoose";
import http from "http";
import { io as ClientIO } from "socket.io-client";
import { app, server } from "../app";
import { getNormalizedToday } from "../controllers/standupController";
import { markAbsentForInactiveInterns } from "../config/cron";
import { Intern } from "../models/Intern";
import { Attendance } from "../models/Attendance";
import { LeaveRequest } from "../models/LeaveRequest";
import { Notification } from "../models/Notification";

const PORT = 5001;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTests = async () => {
  console.log("==========================================================");
  console.log("     KLASSYGO HRM - PHASE 3 INTEGRATION TEST SUITE        ");
  console.log("==========================================================");

  // Wait for mongoose default connection to establish
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) resolve(true);
    else mongoose.connection.once("connected", resolve);
  });

  // Drop the test database to ensure a clean slate
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
  let leaveId = "";
  let notificationId = "";

  console.log("\n--- [1. Creating Test Accounts] ---");

  // A. Register Lead
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Lead User",
        email: leadEmail,
        password,
        role: "Lead",
        department: "Technology",
      }),
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log("✓ Register Lead User: SUCCESS", data.user.email);
      leadUserId = data.user.id || data.user._id;
    } else {
      console.error("✗ Register Lead User: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ Register Lead User error:", (err as Error).message);
  }

  // B. Login Lead
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: leadEmail, password }),
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("✓ Login Lead User: SUCCESS");
      leadToken = data.token;
    } else {
      console.error("✗ Login Lead User: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ Login Lead User error:", (err as Error).message);
  }

  // C. Register Intern
  try {
    const res = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Intern User",
        email: internEmail,
        password,
        role: "Intern",
        department: "Technology",
      }),
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log("✓ Register Intern User: SUCCESS", data.user.email);
      internUserId = data.user.id || data.user._id;
    } else {
      console.error("✗ Register Intern User: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ Register Intern User error:", (err as Error).message);
  }

  // D. Login Intern
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: internEmail, password }),
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("✓ Login Intern User: SUCCESS");
      internToken = data.token;
    } else {
      console.error("✗ Login Intern User: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ Login Intern User error:", (err as Error).message);
  }

  // E. Create Batch
  try {
    const res = await fetch(`${BASE_URL}/batches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${leadToken}`,
      },
      body: JSON.stringify({
        name: "Winter 2026 Batch",
        startDate: new Date("2026-01-01").toISOString(),
        endDate: new Date("2026-06-30").toISOString(),
        isActive: true,
      }),
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log("✓ Create Batch: SUCCESS", data.name);
      batchId = data._id;
    } else {
      console.error("✗ Create Batch: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ Create Batch error:", (err as Error).message);
  }

  // F. Create Intern Profile
  try {
    const res = await fetch(`${BASE_URL}/interns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${leadToken}`,
      },
      body: JSON.stringify({
        name: "Test Intern User",
        email: internEmail,
        batchId,
        track: "Frontend",
        mentor: "Vikram Iyer",
        startDate: "2026-01-01",
        endDate: "2026-06-30",
        avatar: "TI",
        status: "active",
      }),
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log("✓ Create Intern Profile: SUCCESS", data.track);
      internProfileId = data.id || data._id;
    } else {
      console.error("✗ Create Intern Profile: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ Create Intern Profile error:", (err as Error).message);
  }

  console.log("\n--- [2. Daily Standups Endpoints] ---");

  // A. Submit Standup
  try {
    const res = await fetch(`${BASE_URL}/standups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${internToken}`,
      },
      body: JSON.stringify({
        yesterdayWork: "Worked on task routes",
        todayPlan: "Implement daily standup controller and routes",
        blockers: "None",
        mood: "productive",
        completionPercentage: 85,
      }),
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log("✓ POST /standups: SUCCESS");
    } else {
      console.error("✗ POST /standups: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ POST /standups error:", (err as Error).message);
  }

  // B. Reject Duplicate Standup (Enforce only one per day)
  try {
    const res = await fetch(`${BASE_URL}/standups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${internToken}`,
      },
      body: JSON.stringify({
        yesterdayWork: "Duplicate content",
        todayPlan: "Duplicate content plan",
        blockers: "None",
        mood: "tired",
        completionPercentage: 90,
      }),
    });
    const data = await res.json();
    if (res.status === 400) {
      console.log("✓ POST /standups (Duplicate rejection): SUCCESS (Correctly rejected with 400)");
    } else {
      console.error("✗ POST /standups (Duplicate rejection): FAILED (Allowed duplicate submission or returned status other than 400)", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ POST /standups duplicate check error:", (err as Error).message);
  }

  // C. Lead gets all standups
  try {
    const res = await fetch(`${BASE_URL}/standups`, {
      method: "GET",
      headers: { Authorization: `Bearer ${leadToken}` },
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data)) {
      console.log("✓ GET /standups (Lead): SUCCESS, count =", data.length);
    } else {
      console.error("✗ GET /standups (Lead): FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ GET /standups lead check error:", (err as Error).message);
  }

  // D. Intern gets own standups
  try {
    const res = await fetch(`${BASE_URL}/standups/${internUserId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${internToken}` },
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data)) {
      console.log("✓ GET /standups/:internId (Intern own): SUCCESS, count =", data.length);
    } else {
      console.error("✗ GET /standups/:internId (Intern own): FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ GET /standups/:internId intern check error:", (err as Error).message);
  }

  // E. Intern forbidden from getting other intern's standups
  try {
    const res = await fetch(`${BASE_URL}/standups/${leadUserId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${internToken}` },
    });
    const data = await res.json();
    if (res.status === 403) {
      console.log("✓ GET /standups/:internId (Forbidden access): SUCCESS (Correctly blocked with 403)");
    } else {
      console.error("✗ GET /standups/:internId (Forbidden access): FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ GET /standups/:internId forbidden check error:", (err as Error).message);
  }

  console.log("\n--- [3. Attendance Endpoints] ---");

  // A. Check In
  try {
    // If testing late checks, note current time
    const res = await fetch(`${BASE_URL}/attendance/check-in`, {
      method: "POST",
      headers: { Authorization: `Bearer ${internToken}` },
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log("✓ POST /attendance/check-in: SUCCESS, status =", data.status);
    } else {
      console.error("✗ POST /attendance/check-in: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ POST /attendance/check-in error:", (err as Error).message);
  }

  // B. Check Out
  try {
    const res = await fetch(`${BASE_URL}/attendance/check-out`, {
      method: "POST",
      headers: { Authorization: `Bearer ${internToken}` },
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("✓ POST /attendance/check-out: SUCCESS, totalHours =", data.totalHours);
    } else {
      console.error("✗ POST /attendance/check-out: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ POST /attendance/check-out error:", (err as Error).message);
  }

  // C. Get Heatmap Data
  try {
    const res = await fetch(`${BASE_URL}/attendance/heatmap`, {
      method: "GET",
      headers: { Authorization: `Bearer ${internToken}` },
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data) && data.length === 5 && Array.isArray(data[0]) && data[0].length === 7) {
      console.log("✓ GET /attendance/heatmap: SUCCESS, returned 5x7 actions grid");
    } else {
      console.error("✗ GET /attendance/heatmap: FAILED", res.status, data);
    }
  } catch (err) {
    console.error("✗ GET /attendance/heatmap error:", (err as Error).message);
  }

  console.log("\n--- [4. Leave Requests Endpoints] ---");

  // A. Try to apply leave for today/past (Should fail validation)
  try {
    const res = await fetch(`${BASE_URL}/leaves`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${internToken}`,
      },
      body: JSON.stringify({
        type: "sick",
        fromDate: new Date().toISOString().slice(0, 10), // today
        toDate: new Date().toISOString().slice(0, 10),
        reason: "Feeling sick today",
      }),
    });
    const data = await res.json();
    if (res.status === 400) {
      console.log("✓ POST /leaves (Must be requested 1 day in advance validation): SUCCESS (Correctly failed with 400)");
    } else {
      console.error("✗ POST /leaves (Must be requested 1 day in advance validation): FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ POST /leaves advance check error:", (err as Error).message);
  }

  // B. Apply leave for tomorrow (Should succeed)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 2); // Use tomorrow + 1 for safety
  const leaveStartStr = tomorrow.toISOString().slice(0, 10);
  const leaveEndStr = tomorrow.toISOString().slice(0, 10);

  try {
    const res = await fetch(`${BASE_URL}/leaves`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${internToken}`,
      },
      body: JSON.stringify({
        type: "casual",
        fromDate: leaveStartStr,
        toDate: leaveEndStr,
        reason: "Family function tomorrow",
      }),
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log("✓ POST /leaves (Future application): SUCCESS, days =", data.days, "status =", data.status);
      leaveId = data._id;
    } else {
      console.error("✗ POST /leaves (Future application): FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ POST /leaves future check error:", (err as Error).message);
  }

  // C. Lead approves leave request
  try {
    const res = await fetch(`${BASE_URL}/leaves/${leaveId}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${leadToken}`,
      },
      body: JSON.stringify({ status: "Approved" }),
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("✓ PUT /leaves/:id/status (Approved): SUCCESS");
      
      // Verify automatically generated attendance logs
      const generatedAttendance = await Attendance.findOne({
        internId: internUserId,
        date: new Date(leaveStartStr + "T00:00:00.000Z"),
      });

      if (generatedAttendance && generatedAttendance.status === "Leave") {
        console.log("  ✓ Auto-generated Attendance Log: SUCCESS (Marked 'Leave')");
      } else {
        console.error("  ✗ Auto-generated Attendance Log: FAILED", generatedAttendance);
      }

      // Verify intern profile status updated to "leave"
      const profile = await Intern.findOne({ userId: internUserId });
      if (profile && profile.status === "leave") {
        console.log("  ✓ Intern status updated to 'leave': SUCCESS");
      } else {
        console.error("  ✗ Intern status updated to 'leave': FAILED", profile);
      }
    } else {
      console.error("✗ PUT /leaves/:id/status (Approved): FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ PUT /leaves/:id/status approval error:", (err as Error).message);
  }

  console.log("\n--- [5. Notifications Endpoints] ---");

  // A. Fetch Notifications
  try {
    const res = await fetch(`${BASE_URL}/notifications`, {
      method: "GET",
      headers: { Authorization: `Bearer ${internToken}` },
    });
    const data = await res.json();
    if (res.status === 200 && Array.isArray(data) && data.length > 0) {
      console.log("✓ GET /notifications: SUCCESS, count =", data.length);
      const first = data[0];
      // Assert notification payload format matches requirement 5
      if ('id' in first && 'title' in first && 'message' in first && 'type' in first && 'createdAt' in first && 'read' in first && 'module' in first) {
        console.log("  ✓ Payload structure contains [id, title, message, type, createdAt, read, module]: SUCCESS");
        notificationId = first.id;
      } else {
        console.error("  ✗ Payload structure missing keys:", first);
      }
    } else {
      console.error("✗ GET /notifications: FAILED", res.status, data);
    }
  } catch (err) {
    console.error("✗ GET /notifications error:", (err as Error).message);
  }

  // B. Mark Notification as Read
  try {
    const res = await fetch(`${BASE_URL}/notifications/${notificationId}/read`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${internToken}` },
    });
    const data = await res.json();
    if (res.status === 200 && data.read === true) {
      console.log("✓ PUT /notifications/:id/read: SUCCESS");
    } else {
      console.error("✗ PUT /notifications/:id/read: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ PUT /notifications/:id/read error:", (err as Error).message);
  }

  // C. Get Unread Count
  try {
    const res = await fetch(`${BASE_URL}/notifications/unread-count`, {
      method: "GET",
      headers: { Authorization: `Bearer ${internToken}` },
    });
    const data = await res.json();
    if (res.status === 200 && 'count' in data) {
      console.log("✓ GET /notifications/unread-count: SUCCESS, count =", data.count);
    } else {
      console.error("✗ GET /notifications/unread-count: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ GET /notifications/unread-count error:", (err as Error).message);
  }

  console.log("\n--- [6. Cron Auto-Absent Audit] ---");

  // Create a second active intern user who has NOT checked in today
  const inactiveInternEmail = `inactive_${randomSuffix}@klassygo.com`;
  let inactiveInternUserId = "";

  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Inactive Intern User",
        email: inactiveInternEmail,
        password,
        role: "Intern",
        department: "Technology",
      }),
    });
    const regData = await regRes.json();
    inactiveInternUserId = regData.user.id || regData.user._id;

    // Create Intern profile for them
    await fetch(`${BASE_URL}/interns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${leadToken}`,
      },
      body: JSON.stringify({
        name: "Inactive Intern User",
        email: inactiveInternEmail,
        batchId,
        track: "Backend",
        mentor: "Vikram Iyer",
        startDate: "2026-01-01",
        endDate: "2026-06-30",
        avatar: "II",
        status: "active",
      }),
    });

    console.log("Starting Auto-Absent Audit Cron trigger simulation...");
    await markAbsentForInactiveInterns();

    // Verify if they have been marked Absent today
    const normalizedDate = getNormalizedToday();
    const attendance = await Attendance.findOne({
      internId: inactiveInternUserId,
      date: normalizedDate,
    });

    if (attendance && attendance.status === "Absent") {
      console.log("✓ Inactive intern marked 'Absent' correctly: SUCCESS");
    } else {
      console.error("✗ Inactive intern not marked 'Absent': FAILED", attendance);
    }
  } catch (err) {
    console.error("✗ Cron audit test error:", (err as Error).message);
  }

  console.log("\n--- [7. Real-Time Socket.io Propagation] ---");

  // A. Client socket connection with intern auth token
  try {
    const socketClient = ClientIO("http://localhost:5001", {
      auth: { token: internToken },
      transports: ["websocket"],
    });

    await new Promise<void>((resolve, reject) => {
      socketClient.on("connect", () => {
        console.log("✓ Mock client socket connected to server: SUCCESS");
        // Join targeted room
        socketClient.emit("join", internUserId);
        resolve();
      });
      socketClient.on("connect_error", (err) => {
        reject(err);
      });
    });

    // Setup listener for targeted notifications
    const notificationReceivedPromise = new Promise<any>((resolve) => {
      socketClient.on("notification:received", (payload) => {
        resolve(payload);
      });
    });

    // Trigger a notification to Intern via Lead leave rejection action
    // We create a new leave, then decline it
    const leaveRes = await fetch(`${BASE_URL}/leaves`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${internToken}`,
      },
      body: JSON.stringify({
        type: "sick",
        fromDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), // 5 days out
        toDate: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        reason: "Fever test sick leave",
      }),
    });
    const leaveData = await leaveRes.json();
    
    // Decline the leave
    await fetch(`${BASE_URL}/leaves/${leaveData._id}/status`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${leadToken}`,
      },
      body: JSON.stringify({ status: "Rejected" }),
    });

    // Wait for the socket to receive the decline notification
    const socketPayload = await Promise.race([
      notificationReceivedPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error("Socket timeout")), 3000)),
    ]);

    if (socketPayload && socketPayload.title.includes("Rejected")) {
      console.log("✓ Targeted Socket.io notification propagated to room successfully: SUCCESS");
    } else {
      console.error("✗ Targeted Socket.io notification propagation failed:", socketPayload);
    }

    socketClient.disconnect();
  } catch (err) {
    console.error("✗ Socket connection / propagation error:", (err as Error).message);
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
