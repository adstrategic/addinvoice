import { Request, Response, NextFunction } from "express";
import prisma from "./db";

/**
 * Middleware to check if workspace has at least one business
 * Must be used after verifyWorkspaceAccess middleware
 * Returns 403 with BUSINESS_REQUIRED error code if no business exists
 *
 * Usage:
 * - Applied globally in routes/index.ts
 * - Excluded for /businesses routes (so users can create their first business)
 * - Frontend interceptor catches this error and redirects to /setup
 */
export async function requireBusiness(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId;

    if (!workspaceId) {
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Workspace not found",
      });
      return;
    }

    // Check if workspace has at least one business (efficient query)
    // Using count with take:1 stops after finding first business
    const businessCount = await prisma.business.count({
      where: {
        workspaceId,
        deletedAt: null,
      },
      take: 1, // Stop after finding first one (performance optimization)
    });

    if (businessCount === 0) {
      // Return special error that frontend interceptor will catch
      res.status(403).json({
        error: "BUSINESS_REQUIRED",
        message: "You need to create a business before accessing this feature",
        redirectTo: "/setup", // Tell frontend where to redirect
      });
      return;
    }

    // Has business, continue to next middleware/controller
    next();
  } catch (error) {
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }
}
