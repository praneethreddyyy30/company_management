import { Response, Request } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { User } from "../models/User";
import { Intern } from "../models/Intern";
import { Batch } from "../models/Batch";
import { AuthRequest } from "../middlewares/authMiddleware";
import { logActivity } from "../services/activityService";

// POST /api/auth/register
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password, role, department, avatar, batchId, track, startDate, endDate } = req.body;

  if (!name || !email || !password || !role || !department || !avatar) {
    res.status(400).json({ message: "All base user profile fields are required." });
    return;
  }

  if (role !== "Lead" && role !== "Intern") {
    res.status(400).json({ message: "Role must be either 'Lead' or 'Intern'." });
    return;
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(400).json({ message: "User with this email already exists." });
      return;
    }

    // If role is Intern, we require batch, track, and date details
    if (role === "Intern") {
      if (!batchId || !track || !startDate || !endDate) {
        res.status(400).json({ message: "Intern registration requires batchId, track, startDate, and endDate." });
        return;
      }
      const batchExists = await Batch.findById(batchId);
      if (!batchExists) {
        res.status(404).json({ message: "Specified Batch not found." });
        return;
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      department,
      avatar,
    });
    await newUser.save();

    if (role === "Intern") {
      const newIntern = new Intern({
        userId: newUser._id,
        batchId,
        track,
        status: "active",
        avatar,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        taskCompletionPercentage: 0,
        attendancePercentage: 100,
        performance: 80,
        lmsProgress: 0,
        tasksCompleted: 0,
      });
      await newIntern.save();
    }

    // Sign JWT
    const token = jwt.sign(
      {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
      },
      process.env.JWT_SECRET || "klassygo_secret_key_12345_67890",
      { expiresIn: "24h" }
    );

    await logActivity(
      newUser._id.toString(),
      newUser.name,
      "USER_REGISTERED",
      `Registered user account with role: ${newUser.role}`,
      "AUTH",
      "MED",
      req
    );

    res.status(201).json({
      message: "User registered successfully.",
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        department: newUser.department,
        avatar: newUser.avatar,
      },
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// POST /api/auth/login
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required." });
    return;
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password as string);
    if (!isMatch) {
      res.status(401).json({ message: "Invalid email or password." });
      return;
    }

    // Sign JWT
    const token = jwt.sign(
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
      },
      process.env.JWT_SECRET || "klassygo_secret_key_12345_67890",
      { expiresIn: "24h" }
    );

    await logActivity(
      user._id.toString(),
      user.name,
      "USER_LOGGED_IN",
      "Logged into system",
      "AUTH",
      "LOW",
      req
    );

    res.status(200).json({
      message: "Login successful.",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        avatar: user.avatar,
        joinedAt: user.joinedAt,
      },
    });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};

// POST /api/auth/logout
export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  console.log("[Logout Controller] req.user:", req.user);
  if (req.user) {
    try {
      await logActivity(
        req.user.id,
        req.user.name,
        "USER_LOGGED_OUT",
        "Logged out of system",
        "AUTH",
        "LOW",
        req
      );
      console.log("[Logout Controller] Logged USER_LOGGED_OUT successfully");
    } catch (err) {
      console.error("Failed to log logout activity:", err);
    }
  } else {
    console.log("[Logout Controller] req.user is undefined!");
  }
  res.status(200).json({ message: "Logout successful." });
};

// GET /api/auth/me
export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ message: "Not authenticated." });
    return;
  }

  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: `Server error: ${(error as Error).message}` });
  }
};
