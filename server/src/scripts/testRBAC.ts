import dotenv from "dotenv";
import path from "path";
import mongoose from "mongoose";
import { User } from "../models/User";
import { Intern } from "../models/Intern";
import { Task } from "../models/Task";

dotenv.config({ path: path.join(__dirname, "../../.env") });

const BASE_URL = "http://localhost:5000/api";

const cleanup = async () => {
  const mongoUri = process.env.MONGO_URI || "mongodb://localhost:27017/klassygo_hrm";
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(mongoUri);
  }
  
  // Clean up any old test accounts
  const emails = [
    "admin_rbac@klassygo.com",
    "leada_rbac@klassygo.com",
    "leadb_rbac@klassygo.com",
    "interna_rbac@klassygo.com",
    "internb_rbac@klassygo.com"
  ];
  const users = await User.find({ email: { $in: emails } });
  const userIds = users.map(u => u._id);
  
  await Intern.deleteMany({ userId: { $in: userIds } });
  await Task.deleteMany({ assignedTo: { $in: userIds } });
  await User.deleteMany({ email: { $in: emails } });
  
  console.log("[RBAC Test] Cleanup completed.");
};

const run = async () => {
  try {
    await cleanup();

    console.log("\n--- Phase 1: Registering Test Roles ---");
    
    // Register Admin
    const registerAdminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Admin Tester",
        email: "admin_rbac@klassygo.com",
        password: "password123",
        role: "Admin",
        department: "Executive",
        avatar: "AT"
      })
    });
    const adminData = await registerAdminRes.json();
    if (!registerAdminRes.ok) throw new Error(`Admin reg failed: ${JSON.stringify(adminData)}`);
    console.log("Admin registered successfully.");

    // Register Lead A
    const registerLeadARes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Lead A",
        email: "leada_rbac@klassygo.com",
        password: "password123",
        role: "Lead",
        department: "Technology",
        avatar: "LA"
      })
    });
    const leadAData = await registerLeadARes.json();
    if (!registerLeadARes.ok) throw new Error("Lead A registration failed");
    console.log("Lead A registered successfully.");

    // Register Lead B
    const registerLeadBRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Lead B",
        email: "leadb_rbac@klassygo.com",
        password: "password123",
        role: "Lead",
        department: "Technology",
        avatar: "LB"
      })
    });
    const leadBData = await registerLeadBRes.json();
    if (!registerLeadBRes.ok) throw new Error("Lead B registration failed");
    console.log("Lead B registered successfully.");

    // Get Active Batch ID
    const batchRes = await fetch(`${BASE_URL}/batches`, {
      headers: { "Authorization": `Bearer ${adminData.token}` }
    });
    const batches = await batchRes.json();
    const batchId = batches[0]?._id;
    if (!batchId) throw new Error("No active batch found to assign interns.");
    
    console.log("\n--- Phase 2: Creating Interns (Admin Only) ---");
    
    // Create Intern A assigned to Lead A
    const createInternARes = await fetch(`${BASE_URL}/interns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminData.token}`
      },
      body: JSON.stringify({
        name: "Intern A",
        email: "interna_rbac@klassygo.com",
        track: "Frontend",
        mentorId: leadAData.user.id,
        batchId,
        startDate: "2026-01-01",
        endDate: "2026-06-30"
      })
    });
    const internA = await createInternARes.json();
    if (!createInternARes.ok) throw new Error(`Intern A creation failed: ${JSON.stringify(internA)}`);
    console.log(`Intern A created and assigned to Lead A (${internA.mentor}).`);

    // Create Intern B assigned to Lead B
    const createInternBRes = await fetch(`${BASE_URL}/interns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminData.token}`
      },
      body: JSON.stringify({
        name: "Intern B",
        email: "internb_rbac@klassygo.com",
        track: "Backend",
        mentorId: leadBData.user.id,
        batchId,
        startDate: "2026-01-01",
        endDate: "2026-06-30"
      })
    });
    const internB = await createInternBRes.json();
    if (!createInternBRes.ok) throw new Error("Intern B creation failed");
    console.log(`Intern B created and assigned to Lead B (${internB.mentor}).`);

    console.log("\n--- Phase 3: Verifying Data Isolation Controls ---");
    
    // 1. Verify Lead A directory view isolation
    const leadADirectoryRes = await fetch(`${BASE_URL}/interns`, {
      headers: { "Authorization": `Bearer ${leadAData.token}` }
    });
    const leadAInterns = await leadADirectoryRes.json();
    const hasInternA = leadAInterns.some((i: any) => i._id === internA._id);
    const hasInternB = leadAInterns.some((i: any) => i._id === internB._id);
    console.log("Lead A directory query returns Intern A:", hasInternA ? "PASS" : "FAIL");
    console.log("Lead A directory query leaks Intern B:", hasInternB ? "FAIL" : "PASS");
    if (!hasInternA || hasInternB) throw new Error("Data isolation check failed for Lead A directory view.");

    // 2. Verify Lead A cannot view Intern B profile directly
    const getInternBRes = await fetch(`${BASE_URL}/interns/${internB._id}`, {
      headers: { "Authorization": `Bearer ${leadAData.token}` }
    });
    console.log("Lead A direct profile access on Intern B returns 403 Forbidden:", getInternBRes.status === 403 ? "PASS" : "FAIL");
    if (getInternBRes.status !== 403) throw new Error("Leads can access unauthorized intern profiles.");

    // 3. Verify Lead A cannot add an employee
    const leadAddEmpRes = await fetch(`${BASE_URL}/interns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${leadAData.token}`
      },
      body: JSON.stringify({
        name: "Hacker Intern",
        email: "hacker@klassygo.com",
        track: "Frontend",
        batchId,
        startDate: "2026-01-01",
        endDate: "2026-06-30"
      })
    });
    console.log("Lead A employee creation blocked with 403 Forbidden:", leadAddEmpRes.status === 403 ? "PASS" : "FAIL");
    if (leadAddEmpRes.status !== 403) throw new Error("Leads are improperly allowed to create employee accounts.");

    console.log("\n--- Phase 4: Task Operations Isolation ---");

    // 1. Lead A assigns task to Intern A (should succeed)
    const taskARes = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${leadAData.token}`
      },
      body: JSON.stringify({
        title: "Build Landing Page",
        assignedTo: internA.userId._id,
        priority: "high",
        dueDate: "2026-07-10"
      })
    });
    console.log("Lead A can assign task to their own intern:", taskARes.ok ? "PASS" : "FAIL");
    if (!taskARes.ok) throw new Error("Lead could not assign task to their own intern.");

    // 2. Lead A assigns task to Intern B (should fail)
    const taskBRes = await fetch(`${BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${leadAData.token}`
      },
      body: JSON.stringify({
        title: "Malicious Task",
        assignedTo: internB.userId._id,
        priority: "high",
        dueDate: "2026-07-10"
      })
    });
    console.log("Lead A blocked from assigning task to Intern B:", taskBRes.status === 403 ? "PASS" : "FAIL");
    if (taskBRes.status !== 403) throw new Error("Leads can improperly assign tasks to unauthorized interns.");

    console.log("\n--- Phase 5: Reassignment & Cascading Unassignment ---");

    // 1. Admin reassigns Intern A to Lead B
    const reassignRes = await fetch(`${BASE_URL}/interns/${internA._id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${adminData.token}`
      },
      body: JSON.stringify({
        mentorId: leadBData.user.id
      })
    });
    const reassignedIntern = await reassignRes.json();
    if (!reassignRes.ok) throw new Error("Reassignment failed");
    console.log(`Reassigned Intern A to Lead B. New mentor: ${reassignedIntern.mentor}`);

    // Verify visibility shift
    const leadADirectory2Res = await fetch(`${BASE_URL}/interns`, {
      headers: { "Authorization": `Bearer ${leadAData.token}` }
    });
    const leadAInterns2 = await leadADirectory2Res.json();
    const hasInternA2 = leadAInterns2.some((i: any) => i._id === internA._id);

    const leadBDirectoryRes = await fetch(`${BASE_URL}/interns`, {
      headers: { "Authorization": `Bearer ${leadBData.token}` }
    });
    const leadBInterns = await leadBDirectoryRes.json();
    const hasInternAByB = leadBInterns.some((i: any) => i._id === internA._id);

    console.log("Intern A vanished from Lead A's feed:", !hasInternA2 ? "PASS" : "FAIL");
    console.log("Intern A appeared in Lead B's feed:", hasInternAByB ? "PASS" : "FAIL");
    if (hasInternA2 || !hasInternAByB) throw new Error("Reassignment visibility shift failed.");

    // 2. Delete Lead B (triggers cascading unassignment middleware)
    console.log("Deleting Lead B user to test cascading unassignment...");
    await User.findOneAndDelete({ email: "leadb_rbac@klassygo.com" });

    // Look up Intern A in DB and check mentorId
    const checkIntern = await Intern.findById(internA._id);
    console.log("Lead deletion set Intern A's mentorId to null:", checkIntern?.mentorId == null ? "PASS" : "FAIL");
    console.log("Lead deletion set Intern A's mentor to 'Unassigned':", checkIntern?.mentor === "Unassigned" ? "PASS" : "FAIL");
    if (checkIntern?.mentorId != null || checkIntern?.mentor !== "Unassigned") {
      throw new Error("Cascading unassignment hook failed.");
    }

    console.log("\n[RBAC Test SUCCESS] All integration test cases passed cleanly! 🎉");
    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error("\n[RBAC Test FAILED] Test aborted with error:", error);
    await cleanup();
    process.exit(1);
  }
};

run();
