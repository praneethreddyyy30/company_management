import { validateEnv } from "./config/env";
// Boot configuration validation immediately
validateEnv();

import express, { Request, Response, NextFunction } from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";
import { connectDB } from "./config/db";
import authRoutes from "./routes/authRoutes";
import internRoutes from "./routes/internRoutes";
import batchRoutes from "./routes/batchRoutes";
import taskRoutes from "./routes/taskRoutes";
import standupRoutes from "./routes/standupRoutes";
import attendanceRoutes from "./routes/attendanceRoutes";
import leaveRoutes from "./routes/leaveRoutes";
import notificationRoutes from "./routes/notificationRoutes";
import aiRoutes from "./routes/aiRoutes";
import certificateRoutes from "./routes/certificateRoutes";
import offerRoutes from "./routes/offerRoutes";
import activityRoutes from "./routes/activityRoutes";
import analyticsRoutes from "./routes/analyticsRoutes";
import dashboardRoutes from "./routes/dashboardRoutes";
import searchRoutes from "./routes/searchRoutes";
import evaluationRoutes from "./routes/evaluationRoutes";
import policyRoutes from "./routes/policyRoutes";
import candidateRoutes from "./routes/candidateRoutes";
import { initCronJobs } from "./config/cron";
import { errorHandler } from "./middlewares/errorHandler";

// Connect to MongoDB
connectDB();

// Initialize Cron Jobs
initCronJobs();

const app = express();
const server = http.createServer(app);

// Request ID middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  req.headers["x-request-id"] = req.headers["x-request-id"] || Math.random().toString(36).substring(2, 15);
  next();
});

// Setup Morgan Logging with request-id tracking
morgan.token("id", (req: any) => req.headers["x-request-id"] as string);
const morganFormat = ":method :url :status :res[content-length] - :response-time ms [Request-ID: :id]";
app.use(morgan(morganFormat));

// CORS Security Setup
const allowedOrigins = process.env.CORS_ORIGIN 
  ? process.env.CORS_ORIGIN.split(",").map(o => o.trim())
  : ["http://localhost:8080", "http://localhost:8081", "http://localhost:3000", "http://localhost:5173"];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.indexOf(origin) !== -1 || allowedOrigins.includes("*")) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

// Security headers
app.use(helmet());

// MongoDB Query Sanitization
app.use(mongoSanitize());

// Custom XSS Sanitizer Middleware
const xssSanitizer = (req: Request, res: Response, next: NextFunction) => {
  const sanitize = (data: any): any => {
    if (typeof data === "string") {
      return data
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");
    }
    if (Array.isArray(data)) {
      return data.map(sanitize);
    }
    if (data !== null && typeof data === "object") {
      const clean: any = {};
      for (const key in data) {
        clean[key] = sanitize(data[key]);
      }
      return clean;
    }
    return data;
  };

  if (req.body) req.body = sanitize(req.body);
  if (req.query) req.query = sanitize(req.query);
  if (req.params) req.params = sanitize(req.params);
  next();
};
app.use(xssSanitizer);

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 10000, // Generous limit in dev/testing
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: "error",
    code: "TOO_MANY_REQUESTS",
    message: "Too many requests from this IP. Please try again after 15 minutes."
  }
});
app.use("/api/", apiLimiter);

app.use(express.json());

// Bind endpoints
app.use("/api/auth", authRoutes);
app.use("/api/interns", internRoutes);
app.use("/api/batches", batchRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/standups", standupRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/ai-performance", aiRoutes);
app.use("/api/certificates", certificateRoutes);
app.use("/api/offer-letters", offerRoutes);
app.use("/api/activity", activityRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/evaluations", evaluationRoutes);
app.use("/api/policies", policyRoutes);
app.use("/api/candidates", candidateRoutes);

// Setup Socket.io WebSockets
const io = new Server(server, {
  cors: {
    origin: ["http://localhost:8080", "http://localhost:8081", "http://localhost:3000", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

// Real-time communication setup
io.on("connection", (socket) => {
  console.log(`Socket Client Connected: ${socket.id}`);

  // Allow users to join a private room identified by their user ID
  socket.on("join", (userId: string) => {
    socket.join(userId);
    console.log(`Socket Client ${socket.id} joined room: ${userId}`);
  });

  socket.on("disconnect", () => {
    console.log(`Socket Client Disconnected: ${socket.id}`);
  });
});

// Health check API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    uptime: process.uptime(),
    mongodbStatus: mongooseConnectionState(),
    socketioStatus: io && io.engine ? `${io.engine.clientsCount} clients connected` : "disconnected",
    currentAIProvider: process.env.AI_PROVIDER || "mock",
    version: process.env.APP_VERSION || "1.0.0",
    timestamp: new Date().toISOString()
  });
});

function mongooseConnectionState(): string {
  const states: Record<number, string> = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
  };
  const mongoose = require("mongoose");
  return states[mongoose.connection.readyState] || "unknown";
}

// Error handling middleware
app.use(errorHandler);

// Start Server listening
if (process.env.NODE_ENV !== "test") {
  const PORT = process.env.PORT || 5000;
  server.listen(PORT, () => {
    console.log(`KLASSYGO HRM Server running in ${process.env.NODE_ENV || "development"} mode on port ${PORT}`);
  });
}

export { app, io, server };
