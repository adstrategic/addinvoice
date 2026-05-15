import type { NextFunction, Request, Response } from "express";

import { LimitExceededError, planAllowsAdvances, prisma } from "@addinvoice/db";

import {
  InternalError,
  UnauthorizedError,
} from "../errors/EntityErrors.js";

// Blocks access to the Advances module for plans that don't include it.
// FREE_TRIAL, ESSENTIAL, and LIFETIME are allowed; MINIMUM is rejected.
export async function requireAdvancesAccess(
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

    const workspace = await prisma.workspace.findUnique({
      select: { subscriptionPlan: true },
      where: { id: workspaceId },
    });

    if (!planAllowsAdvances(workspace?.subscriptionPlan)) {
      next(
        new LimitExceededError(
          "ADVANCES_PLAN_REQUIRED",
          "The Advances module requires an Essential plan or higher",
          { plan: workspace?.subscriptionPlan ?? null },
        ),
      );
      return;
    }

    next();
  } catch (error) {
    console.error("Advances guard error:", error);
    next(new InternalError("Internal server error"));
  }
}
