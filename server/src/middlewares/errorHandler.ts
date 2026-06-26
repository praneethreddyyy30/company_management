import { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
  errors?: any[];
}

export const errorHandler = (
  err: CustomError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "An unexpected server error occurred.";
  const errorCode = err.code || "INTERNAL_SERVER_ERROR";
  const errors = err.errors || [];

  // Log error stack locally in development mode
  if (process.env.NODE_ENV !== "test") {
    console.error(`[Error Handler] [${errorCode}] ${statusCode}: ${message}`);
    if (err.stack) console.error(err.stack);
  }

  res.status(statusCode).json({
    status: "error",
    message,
    code: errorCode,
    errors,
  });
};

// Async controller wrapper to catch errors and pass them to the next error middleware
export const catchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};
