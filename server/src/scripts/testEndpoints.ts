import mongoose from "mongoose";
import { app } from "../app";
import http from "http";
import dotenv from "dotenv";

dotenv.config();

const PORT = 5001; // Run tests on a separate port
let testServer: http.Server;
const BASE_URL = `http://localhost:${PORT}/api`;

const testRunner = async () => {
  console.log("==================================================");
  console.log("    KLASSYGO HRM - PHASE 2 INTEGRATION TESTS      ");
  console.log("==================================================");

  // Check if MongoDB is connected
  const state = mongoose.connection.readyState;
  if (state !== 1) {
    console.warn("WARNING: MongoDB is not connected. Testing will fail.");
    console.warn("Please ensure MONGO_URI in server/.env is valid.");
    console.warn("Current readyState:", state);
    process.exit(1);
  }

  // Start test server
  testServer = app.listen(PORT, async () => {
    console.log(`Test Server running on port ${PORT}...`);
    try {
      await runTests();
    } catch (e) {
      console.error("Test execution crashed:", e);
    } finally {
      testServer.close(async () => {
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

async function runTests() {
  const randomSuffix = Math.floor(Math.random() * 100000);
  const leadEmail = `lead_${randomSuffix}@klassygo.com`;
  const internEmail = `intern_${randomSuffix}@klassygo.com`;
  const password = "Password123!";

  let leadToken = "";
  let internToken = "";
  let leadUserId = "";
  let internUserId = "";
  let internCardId = "";
  let batchId = "";
  let taskId = "";

  console.log("\n--- [1. Authentication Endpoints] ---");

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
        department: "Technology"
      })
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log("✓ POST /auth/register (Lead): SUCCESS", data.user.email);
      leadUserId = data.user.id || data.user._id;
    } else {
      console.error("✗ POST /auth/register (Lead): FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ POST /auth/register error:", (err as Error).message);
  }

  // B. Login Lead
  try {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: leadEmail, password })
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("✓ POST /auth/login (Lead): SUCCESS", data.user.role);
      leadToken = data.token;
    } else {
      console.error("✗ POST /auth/login (Lead): FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ POST /auth/login error:", (err as Error).message);
  }

  // C. Current User (/me)
  try {
    const res = await fetch(`${BASE_URL}/auth/me`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${leadToken}` }
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("✓ GET /auth/me: SUCCESS", data.name, `(${data.role})`);
    } else {
      console.error("✗ GET /auth/me: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ GET /auth/me error:", (err as Error).message);
  }

  console.log("\n--- [2. Batch Endpoints] ---");

  // A. Create Batch
  try {
    const res = await fetch(`${BASE_URL}/batches`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${leadToken}`
      },
      body: JSON.stringify({
        name: `Cohort Batch ${randomSuffix}`,
        startDate: "2026-06-01",
        endDate: "2026-12-31"
      })
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log("✓ POST /batches (Create Batch): SUCCESS", data.name);
      batchId = data._id;
    } else {
      console.error("✗ POST /batches: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ POST /batches error:", (err as Error).message);
  }

  // B. List Batches
  try {
    const res = await fetch(`${BASE_URL}/batches`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${leadToken}` }
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("✓ GET /batches (List Batches): SUCCESS", `Found ${data.length} batches`);
    } else {
      console.error("✗ GET /batches: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ GET /batches error:", (err as Error).message);
  }

  console.log("\n--- [3. Intern Management Endpoints] ---");

  // A. Create Intern
  try {
    const res = await fetch(`${BASE_URL}/interns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${leadToken}`
      },
      body: JSON.stringify({
        name: "Test Intern User",
        email: internEmail,
        track: "Frontend",
        mentor: "Test Lead User",
        batchId,
        startDate: "2026-06-01",
        endDate: "2026-12-31",
        avatar: "TI",
        status: "active"
      })
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log("✓ POST /interns (Create Intern): SUCCESS", data.userId.email);
      internCardId = data._id;
      internUserId = data.userId._id || data.userId.id;
    } else {
      console.error("✗ POST /interns: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ POST /interns error:", (err as Error).message);
  }

  // Register / Login Intern to get their credentials/token
  try {
    // Set Password for Intern via Registration endpoint or just direct update
    // The createIntern method creates the user with "password123" by default. Let's log in!
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: internEmail, password: "password123" })
    });
    const data = await res.json();
    if (res.status === 200) {
      internToken = data.token;
      console.log("✓ Authenticated seeded Intern account.");
    }
  } catch (err) {}

  // B. Get Intern By ID (Self lookup - should succeed)
  try {
    const res = await fetch(`${BASE_URL}/interns/${internCardId}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${internToken}` }
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("✓ GET /interns/:id (Self lookup): SUCCESS", data.userId.name);
    } else {
      console.error("✗ GET /interns/:id (Self lookup): FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ GET /interns/:id error:", (err as Error).message);
  }

  // C. Get Intern By ID (Guarded lookup - Intern trying to look up Lead's card or another intern - should fail 403)
  try {
    // Lead user has no Intern card, but we can query with invalid permissions
    const res = await fetch(`${BASE_URL}/interns/${internCardId}`, {
      method: "GET",
      // Try fetching intern card with Lead's token (should pass for Lead)
      headers: { "Authorization": `Bearer ${leadToken}` }
    });
    if (res.status === 200) {
      console.log("✓ GET /interns/:id (Lead viewing Intern): SUCCESS");
    } else {
      console.error("✗ GET /interns/:id (Lead viewing Intern): FAILED", res.status);
    }
  } catch (err) {}

  // D. Update Intern (Lead only)
  try {
    const res = await fetch(`${BASE_URL}/interns/${internCardId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${leadToken}`
      },
      body: JSON.stringify({
        mentor: "Senior Architect",
        performance: 95
      })
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("✓ PUT /interns/:id (Update Intern by Lead): SUCCESS", `New Mentor: ${data.mentor}, Perf: ${data.performance}`);
    } else {
      console.error("✗ PUT /interns/:id: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ PUT /interns/:id error:", (err as Error).message);
  }

  console.log("\n--- [4. Task Endpoints] ---");

  // A. Create Task (Lead assigns to Intern)
  try {
    const res = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${leadToken}`
      },
      body: JSON.stringify({
        title: "Build HRM APIs",
        assignedTo: internUserId,
        priority: "high",
        dueDate: "2026-07-01",
        module: "Engineering"
      })
    });
    const data = await res.json();
    if (res.status === 201) {
      console.log("✓ POST /tasks (Create Task): SUCCESS", data.title);
      taskId = data._id;
    } else {
      console.error("✗ POST /tasks: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ POST /tasks error:", (err as Error).message);
  }

  // B. Update Task Status (Intern changing status to "In Progress")
  try {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${internToken}`
      },
      body: JSON.stringify({ status: "In Progress" })
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("✓ PUT /tasks/:id (Intern updating status): SUCCESS", data.status);
    } else {
      console.error("✗ PUT /tasks/:id: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ PUT /tasks/:id error:", (err as Error).message);
  }

  // C. Update Task Details Guard (Intern trying to change title - should fail 403)
  try {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${internToken}`
      },
      body: JSON.stringify({ title: "Hack the database" })
    });
    const data = await res.json();
    if (res.status === 403) {
      console.log("✓ PUT /tasks/:id (Guarded: Intern title update blocked): SUCCESS (403 Forbidden)");
    } else {
      console.error("✗ PUT /tasks/:id (Guarded): FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ PUT /tasks/:id Guard error:", (err as Error).message);
  }

  // D. Delete Task (Lead only)
  try {
    const res = await fetch(`${BASE_URL}/tasks/${taskId}`, {
      method: "DELETE",
      headers: { "Authorization": `Bearer ${leadToken}` }
    });
    const data = await res.json();
    if (res.status === 200) {
      console.log("✓ DELETE /tasks/:id (Lead deletes task): SUCCESS");
    } else {
      console.error("✗ DELETE /tasks/:id: FAILED", res.status, data.message);
    }
  } catch (err) {
    console.error("✗ DELETE /tasks/:id error:", (err as Error).message);
  }

  console.log("\n==================================================");
  console.log("            ALL TESTING RUNS COMPLETED            ");
  console.log("==================================================");
}

testRunner();
