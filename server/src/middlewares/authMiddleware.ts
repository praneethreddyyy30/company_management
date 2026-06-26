import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role: "Lead" | "Intern";
    department: string;
  };
}

export const authenticateJWT = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  let token = "";

  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  } else if (req.query.token) {
    token = req.query.token as string;
  }

  if (!token) {
    res.status(401).json({ message: "Authentication token missing or invalid." });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "klassygo_secret_key_12345_67890") as {
      id: string;
      name: string;
      email: string;
      role: "Lead" | "Intern";
      department: string;
    };
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ message: "Access forbidden: invalid or expired token." });
  }
};

export const requireRole = (roles: ("Lead" | "Intern")[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !roles.includes(req.user.role)) {
      res.status(403).json({ message: "Access forbidden: insufficient permissions." });
      return;
    }
    next();
  };
};
