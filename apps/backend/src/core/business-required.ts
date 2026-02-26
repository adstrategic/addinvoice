import type { NextFunction, Request, Response } from "express";

import { prisma } from "@addinvoice/db";

import {
  BusinessRequiredError,
  InternalError,
  UnauthorizedError,
} from "../errors/EntityErrors.js";

/**
 * Middleware to check if workspace has at least one business
 * Must be used after verifyWorkspaceAccess middleware
 * Throws BusinessRequiredError (403) if no business exists; frontend interceptor redirects to /setup.
 *
 * Usage:
 * - Applied globally in routes/index.ts
 * - Excluded for /businesses routes (so users can create their first business)
 */
export async function requireBusiness(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const workspaceId = req.workspaceId;

    if (!workspaceId) {
      next(new UnauthorizedError("Workspace not found"));
      return;
    }

    const businessCount = await prisma.business.count({
      take: 1,
      where: {
        workspaceId,
      },
    });

    if (businessCount === 0) {
      next(
        new BusinessRequiredError(
          "You need to create a business before accessing this feature",
          "/setup",
        ),
      );
      return;
    }

    next();
  } catch {
    next(new InternalError("Internal server error"));
  }
}
