import { Request } from "express";
import { ActivityLog } from "../models/ActivityLog";
import { io } from "../app";

export const logActivity = async (
  userId: string,
  userName: string,
  action: string,
  details: string,
  module: string,
  impact: "LOW" | "MED" | "HIGH",
  req?: Request | any
): Promise<void> => {
  try {
    let ipAddress = "";
    let userAgent = "";

    if (req) {
      const forwarded = req.headers["x-forwarded-for"];
      if (forwarded) {
        ipAddress = Array.isArray(forwarded) ? forwarded[0] : forwarded.split(",")[0].trim();
      } else {
        ipAddress = req.ip || req.socket.remoteAddress || "";
      }
      userAgent = req.headers["user-agent"] || "";
    }

    const log = new ActivityLog({
      userId,
      userName,
      action,
      details,
      module,
      impact,
      ipAddress,
      userAgent,
      timestamp: new Date()
    });

    await log.save();

    if (io) {
      io.emit("activity:received", log);
      io.emit("activity:new", log);
    }
  } catch (error) {
    console.error("Error logging activity:", error);
  }
};
