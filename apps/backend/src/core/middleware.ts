import { Request, Response, NextFunction } from "express";
import rateLimit from "express-rate-limit";
import CustomError from "../errors/CustomError";
import { Prisma } from "@addinvoice/db";

/**
 * Rate limiting middleware
 * Limits requests to 100 per 15 minutes per IP
 */
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Error handling middleware
 * Must be used after all routes
 * Handles all errors centrally with proper status codes and responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.log(err);
  // Handle our custom AppError instances (includes all feature-specific errors)
  if (err instanceof CustomError) {
    res.status(err.statusCode).json({
      error: err.name,
      message: err.message,
    });
    return;
  }

  // Handle Prisma errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Handle unique constraint violations
    if (err.code === "P2002") {
      res.status(409).json({
        error: "Conflict",
        message: "A record with this value already exists",
      });
      return;
    }

    // Handle record not found
    if (err.code === "P2025") {
      res.status(404).json({
        error: "Not Found",
        message: "The requested resource was not found",
      });
      return;
    }

    // Generic Prisma error
    res.status(400).json({
      error: "Database error",
      message: "An error occurred while processing your request",
    });
    return;
  }

  // Handle Zod validation errors
  // if (err.name === "ZodError") {
  //   res.status(400).json({
  // success: false,
  //     error: "Validation error",
  //     message: err.message,
  //     // In development, include validation details
  //     ...(process.env.NODE_ENV === "development" && {
  //       details: (err as any).issues,
  //     }),
  //   });
  //   return;
  // }

  // Default error - don't leak error details in production
  res.status(500).json({
    error: "Internal server error",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected error occurred",
  });
}
