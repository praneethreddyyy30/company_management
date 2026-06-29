import bcrypt from "bcryptjs";
import { User } from "../models/User";
import { Intern } from "../models/Intern";
import { Batch } from "../models/Batch";

export const autoSeedDB = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      return; // DB already has users, no need to auto-seed
    }

    console.log("[Auto-Seed] No user accounts found in database. Seeding default credentials...");

    const hashedPassword = await bcrypt.hash("password123", 10);

    // 1. Create Default Admin
    const admin = new User({
      name: "Admin User",
      email: "admin@klassygo.com",
      password: hashedPassword,
      role: "Admin",
      department: "Executive",
      avatar: "AU",
      joinedAt: new Date()
    });
    await admin.save();
    console.log("[Auto-Seed] Created default Admin: admin@klassygo.com");

    // 2. Create Default Lead
    const lead = new User({
      name: "Vikram Iyer",
      email: "lead@klassygo.com",
      password: hashedPassword,
      role: "Lead",
      department: "Technology",
      avatar: "VI",
      joinedAt: new Date()
    });
    await lead.save();
    console.log("[Auto-Seed] Created default Lead: lead@klassygo.com");

    // 3. Create Default Batch
    const batch = new Batch({
      name: "Winter 2026 Batch",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      mentorId: lead._id,
      isActive: true
    });
    await batch.save();
    console.log(`[Auto-Seed] Created default Batch: "${batch.name}"`);

    // 4. Create Default Intern
    const internUser = new User({
      name: "Sneha Reddy",
      email: "intern@klassygo.com",
      password: hashedPassword,
      role: "Intern",
      department: "Technology",
      avatar: "SR",
      joinedAt: new Date()
    });
    await internUser.save();

    const internProfile = new Intern({
      userId: internUser._id,
      batchId: batch._id,
      track: "Frontend",
      mentor: "Vikram Iyer",
      mentorId: lead._id,
      status: "active",
      avatar: "SR",
      startDate: new Date("2026-01-01"),
      endDate: new Date("2026-06-30"),
      taskCompletionPercentage: 0,
      attendancePercentage: 100,
      performance: 80,
      onboarding: {
        completed: false,
        checklist: {
          profileCompleted: false,
          guideRead: false,
          tasksReviewed: false,
          standupSubmitted: false,
          attendanceMarked: false
        }
      }
    });
    await internProfile.save();
    console.log("[Auto-Seed] Created default Intern: intern@klassygo.com");

    console.log("[Auto-Seed] Database auto-seeding completed successfully.");
  } catch (error) {
    console.error("[Auto-Seed] Failed to auto-seed database:", error);
  }
};
