import type { NextFunction, Request, Response } from "express";

import { prisma } from "@addinvoice/db";

import {
  InternalError,
  SubscriptionRequiredError,
  UnauthorizedError,
} from "../errors/EntityErrors.js";

/**
 * Middleware to check if workspace has active subscription
 * Allows read-only access (GET requests) without subscription
 * Blocks write operations (POST, PUT, DELETE, PATCH) without subscription
 * Must be used after verifyWorkspaceAccess middleware
 */
export async function requireSubscription(
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
      select: {
        subscriptionStatus: true,
      },
      where: { id: workspaceId },
    });

    const isActive =
      workspace?.subscriptionStatus === "ACTIVE" ||
      workspace?.subscriptionStatus === "TRIALING";

    if (req.method === "GET" && !isActive) {
      next(
        new SubscriptionRequiredError(
          "Active subscription required for full access",
          { readOnly: true },
        ),
      );
      return;
    }

    if (!isActive && ["DELETE", "PATCH", "POST", "PUT"].includes(req.method)) {
      next(
        new SubscriptionRequiredError(
          "Active subscription required to perform this action",
          { redirectTo: "/subscribe" },
        ),
      );
      return;
    }

    next();
  } catch (error) {
    console.error("Subscription guard error:", error);
    next(new InternalError("Internal server error"));
  }
}
