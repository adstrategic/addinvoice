import type { NextFunction, Request, Response } from "express";

import { LimitExceededError, Prisma } from "@addinvoice/db";
import { getAuth } from "@clerk/express";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

import CustomError from "../errors/CustomError.js";

/**
 * Strict, IP-keyed limiter for unauthenticated public endpoints.
 * Public routes serve quote/proposal signing pages — a handful of requests per visit is normal.
 */
export const publicApiRateLimiter = rateLimit({
  legacyHeaders: false,
  max: 500,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
});

/**
 * Generous, user-keyed limiter for authenticated API endpoints.
 * Keyed by Clerk userId (falling back to IP) so shared-IP offices don't starve each other.
 * 1000 per 15 min comfortably covers heavy dashboard usage (~13 req/navigation × 30 navigations
 * + Clerk token refresh cycles).
 */
export const authApiRateLimiter = rateLimit({
  legacyHeaders: false,
  max: 1000,
  message: "Too many requests, please try again later.",
  standardHeaders: true,
  windowMs: 15 * 60 * 1000,
  keyGenerator: (req) => {
    const { userId } = getAuth(req);
    return userId ?? ipKeyGenerator(req.ip ?? "");
  },
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction,
): void {
  console.error(err);

  // Limit-exceeded errors thrown by the shared @addinvoice/db guards
  if (err instanceof LimitExceededError) {
    res.status(err.statusCode).json({
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      details: err.details,
    });
    return;
  }

  // Handle our custom errors (CustomError and subclasses including FieldValidationError)
  if (err instanceof CustomError) {
    const payload: {
      code: string;
      fields?: Record<string, string[]>;
      message: string;
      readOnly?: boolean;
      redirectTo?: string;
      statusCode: number;
    } = {
      code: typeof err.code === "string" ? err.code : "INTERNAL_ERROR",
      message: err.message,
      statusCode: err.statusCode,
    };
    if ("fields" in err && err.fields && typeof err.fields === "object") {
      payload.fields = err.fields as Record<string, string[]>;
    }
    if (
      "redirectTo" in err &&
      typeof (err as { redirectTo?: string }).redirectTo === "string"
    ) {
      payload.redirectTo = (err as { redirectTo: string }).redirectTo;
    }
    if (
      "readOnly" in err &&
      typeof (err as { readOnly?: boolean }).readOnly === "boolean"
    ) {
      payload.readOnly = (err as { readOnly: boolean }).readOnly;
    }
    res.status(err.statusCode).json(payload);
    return;
  }

  // Handle Prisma errors (same contract: code, message, statusCode)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      res.status(409).json({
        code: "CONFLICT",
        message: "A record with this value already exists",
        statusCode: 409,
      });
      return;
    }
    if (err.code === "P2025") {
      res.status(404).json({
        code: "ERR_NF",
        message: "The requested resource was not found",
        statusCode: 404,
      });
      return;
    }
    res.status(400).json({
      code: "INTERNAL_ERROR",
      message: "An error occurred while processing your request",
      statusCode: 400,
    });
    return;
  }

  // Default error - don't leak error details in production
  res.status(500).json({
    code: "INTERNAL_ERROR",
    message:
      process.env.NODE_ENV === "development"
        ? err.message
        : "An unexpected error occurred",
    statusCode: 500,
  });
}
