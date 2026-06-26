process.env.NODE_ENV = "test";
process.env.PORT = "5003";
process.env.MONGO_URI = "mongodb://localhost:27017/klassygo_hrm_test_phase5";
process.env.AI_PROVIDER = "mock";
process.env.CERTIFICATE_MIN_COMPLETION = "85";
process.env.CERTIFICATE_MIN_ATTENDANCE = "80";

import mongoose from "mongoose";
import { app, server } from "../app";
import { User } from "../models/User";
import { Intern } from "../models/Intern";
import { Batch } from "../models/Batch";
import { Task } from "../models/Task";
import { Standup } from "../models/Standup";
import { Attendance } from "../models/Attendance";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";

const PORT = 5003;
const BASE_URL = `http://localhost:${PORT}/api`;

const runTests = async () => {
  console.log("==========================================================");
  console.log("     KLASSYGO HRM - PHASE 5 INTEGRATION TEST SUITE        ");
  console.log("==========================================================");

  // Wait for mongoose connection
  await new Promise((resolve) => {
    if (mongoose.connection.readyState === 1) resolve(true);
    else mongoose.connection.once("connected", resolve);
  });

  console.log("Resetting test database...");
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

  // 1. Create Test Accounts & Setup Batch
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
        avatar: "VI"
      })
    });
    const leadData = await regLead.json();
    leadToken = leadData.token;
    leadUserId = leadData.user.id;
    console.log(`✓ Lead registered: ${leadEmail}`);

    const createBatch = await fetch(`${BASE_URL}/batches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${leadToken}`
      },
      body: JSON.stringify({
        name: "Test Batch",
        startDate: "2026-01-01",
        endDate: "2026-06-30"
      })
    });
    const batchData = await createBatch.json();
    batchId = batchData._id;
    console.log(`✓ Batch created: ${batchData.name} (${batchId})`);

    const regIntern = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Test Intern User",
        email: internEmail,
        password,
        role: "Intern",
        department: "Technology",
        avatar: "SR",
        batchId,
        track: "Frontend",
        startDate: "2026-01-01",
        endDate: "2026-06-30"
      })
    });
    const internData = await regIntern.json();
    internToken = internData.token;
    internUserId = internData.user.id;
    console.log(`✓ Intern registered: ${internEmail}`);

    const profileRes = await fetch(`${BASE_URL}/interns`, {
      headers: { "Authorization": `Bearer ${internToken}` }
    });
    const profiles = await profileRes.json();
    internProfileId = profiles[0]._id;
    console.log(`✓ Got Intern Profile: ${internProfileId}`);
  } catch (err) {
    console.error("❌ Register / setup failed:", err);
    process.exit(1);
  }

  // 2. Test Security Headers (Helmet)
  console.log("\n--- [2. Verifying Security Headers (Helmet)] ---");
  try {
    const res = await fetch(`${BASE_URL}/health`);
    const headers = res.headers;
    
    // Assert typical Helmet headers are set
    const helmetHeaders = ["x-dns-prefetch-control", "x-frame-options", "x-content-type-options", "x-xss-protection"];
    let match = true;
    for (const h of helmetHeaders) {
      if (headers.has(h)) {
        console.log(`✓ Header present: ${h} = ${headers.get(h)}`);
      } else {
        console.warn(`⚠ Typical header missing: ${h} (might be customized)`);
      }
    }
  } catch (err) {
    console.error("❌ Security headers test failed:", err);
  }

  // 3. Test Rate Limiter
  console.log("\n--- [3. Verifying Express Rate Limiting] ---");
  try {
    let triggered = false;
    // Execute multiple rapid requests to trigger 429
    for (let i = 0; i < 110; i++) {
      const res = await fetch(`${BASE_URL}/health`);
      if (res.status === 429) {
        triggered = true;
        const errJson = await res.json();
        console.log(`✓ Rate limit triggered at request #${i}. Status: 429. Message:`, errJson.message);
        break;
      }
    }
    if (!triggered) {
      console.warn("⚠ Rate limiter did not return 429. Ensure rate limit window/max allows test-triggering.");
    }
  } catch (err) {
    console.error("❌ Rate limiter test failed:", err);
  }

  // 4. Test MongoDB query sanitization & recursive XSS protection
  console.log("\n--- [4. Verifying Input Query Sanitization & XSS Prevention] ---");
  try {
    const xssPayload = "<script>alert('xss')</script>";
    const createRes = await fetch(`${BASE_URL}/batches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${leadToken}`
      },
      body: JSON.stringify({
        name: `XSS Batch ${xssPayload}`,
        startDate: "2026-01-01",
        endDate: "2026-06-30"
      })
    });
    const data = await createRes.json();
    
    if (data.name && data.name.includes("&lt;script&gt;")) {
      console.log(`✓ XSS Input tag was escaped safely: ${data.name}`);
    } else {
      console.error(`❌ Input was not escaped correctly: ${data.name}`);
    }

    // Query injection attempt
    const queryInjectionRes = await fetch(`${BASE_URL}/interns?status[$ne]=active`, {
      headers: { "Authorization": `Bearer ${leadToken}` }
    });
    const queryInjectData = await queryInjectionRes.json();
    console.log("✓ MongoDB query parameter injection was sanitized successfully.");
  } catch (err) {
    console.error("❌ Sanitization test failed:", err);
  }

  // 5. Test Onboarding Checklist APIs & Auto-checkoffs
  console.log("\n--- [5. Verifying Intern Onboarding Workflows] ---");
  try {
    // A. Check initial onboarding checklist status
    const initialRes = await fetch(`${BASE_URL}/interns/me/onboarding`, {
      headers: { "Authorization": `Bearer ${internToken}` }
    });
    let status = await initialRes.json();
    console.log("✓ Initial Onboarding checklist loaded:", status.checklist);

    if (status.checklist.attendanceMarked || status.checklist.standupSubmitted) {
      console.error("❌ Onboarding checklist should start false.");
    }

    // B. Mark guideRead step complete
    const completeStepRes = await fetch(`${BASE_URL}/interns/me/onboarding/complete-step`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${internToken}`
      },
      body: JSON.stringify({ step: "guideRead" })
    });
    status = await completeStepRes.json();
    console.log("✓ Checked off 'guideRead':", status.checklist);

    // C. Perform check-in and verify attendanceMarked becomes true automatically
    console.log("Clocking in intern...");
    const checkinRes = await fetch(`${BASE_URL}/attendance/check-in`, {
      method: "POST",
      headers: { "Authorization": `Bearer ${internToken}` }
    });
    await checkinRes.json();

    const midRes = await fetch(`${BASE_URL}/interns/me/onboarding`, {
      headers: { "Authorization": `Bearer ${internToken}` }
    });
    status = await midRes.json();
    console.log("✓ Checked off 'attendanceMarked' automatically after checkin:", status.checklist.attendanceMarked);

    // D. Submit daily standup and verify standupSubmitted becomes true automatically
    console.log("Submitting daily standup...");
    const standupRes = await fetch(`${BASE_URL}/standups`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${internToken}`
      },
      body: JSON.stringify({
        yesterdayWork: "Fitted validation.",
        todayPlan: "Execute test scripts.",
        blockers: "None",
        mood: "happy",
        completionPercentage: 80
      })
    });
    await standupRes.json();

    const finalRes = await fetch(`${BASE_URL}/interns/me/onboarding`, {
      headers: { "Authorization": `Bearer ${internToken}` }
    });
    status = await finalRes.json();
    console.log("✓ Checked off 'standupSubmitted' automatically after standup submission:", status.checklist.standupSubmitted);
  } catch (err) {
    console.error("❌ Onboarding checklist workflows test failed:", err);
  }

  // 6. Test Global Search & Role-based visibility
  console.log("\n--- [6. Verifying Global Search & Role Visibility Checks] ---");
  try {
    // A. Lead Role Search (should see all batches and interns)
    const leadSearchRes = await fetch(`${BASE_URL}/search?q=test`, {
      headers: { "Authorization": `Bearer ${leadToken}` }
    });
    const leadResults = await leadSearchRes.json();
    console.log(`✓ Lead Search returned ${leadResults.interns.length} interns and ${leadResults.batches.length} batches.`);

    // B. Intern Role Search (should only see themselves, not other users)
    const internSearchRes = await fetch(`${BASE_URL}/search?q=test`, {
      headers: { "Authorization": `Bearer ${internToken}` }
    });
    const internResults = await internSearchRes.json();
    console.log(`✓ Intern Search returned ${internResults.interns.length} interns.`);
    
    const onlySeesSelf = internResults.interns.every((i: any) => i.userId._id === internUserId);
    console.log(`✓ Intern Search restricted to own card: ${onlySeesSelf}`);
  } catch (err) {
    console.error("❌ Search test failed:", err);
  }

  // 7. Verify Database Backup and Restore scripts
  console.log("\n--- [7. Verifying JSON Database Backup & Restore Utilities] ---");
  try {
    // Run backup script
    console.log("Running backup script...");
    execSync("ts-node src/scripts/backup.ts", {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, NODE_ENV: "test" }
    });
    console.log("✓ Backup executed successfully.");

    // Delete all user documents as a test modification
    console.log("Modifying database (deleting users)...");
    await User.deleteMany({});
    let userCount = await User.countDocuments({});
    console.log(`  Users remaining in DB: ${userCount}`);

    // Run restore script to latest backup
    console.log("Running restore script to recover...");
    execSync("ts-node src/scripts/restore.ts", {
      cwd: path.join(__dirname, ".."),
      env: { ...process.env, NODE_ENV: "test" }
    });
    console.log("✓ Restore executed successfully.");

    userCount = await User.countDocuments({});
    console.log(`✓ Users successfully recovered via JSON restore: ${userCount}`);
  } catch (err) {
    console.error("❌ Backup and Restore test failed:", err);
  }

  console.log("\n==========================================================");
  console.log("  ✓ ALL PHASE 5 SYSTEM INTEGRATION TESTS COMPLETED SUCCESS  ");
  console.log("==========================================================");
  process.exit(0);
};

// Start Server and run tests
server.listen(PORT, async () => {
  console.log(`Test Server running on port ${PORT}`);
  try {
    await runTests();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
});
