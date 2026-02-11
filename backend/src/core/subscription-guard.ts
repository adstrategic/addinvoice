import { Request, Response, NextFunction } from "express";
import prisma from "./db";

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
      res.status(401).json({
        error: "UNAUTHORIZED",
        message: "Workspace not found",
      });
      return;
    }

    // Check subscription status (from local cache - Stripe is source of truth)
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        subscriptionStatus: true,
      },
    });

    const isActive =
      workspace?.subscriptionStatus === "ACTIVE" ||
      workspace?.subscriptionStatus === "TRIALING";

    // Allow read-only access (GET requests) without subscription
    if (req.method === "GET" && !isActive) {
      // Return 402 Payment Required but allow the request to continue
      // Frontend can handle this to show read-only mode
      res.status(402).json({
        error: "SUBSCRIPTION_REQUIRED",
        message: "Active subscription required for full access",
        readOnly: true,
      });
      return;
    }

    // Block write operations without active subscription
    if (!isActive && ["POST", "PUT", "DELETE", "PATCH"].includes(req.method)) {
      res.status(402).json({
        error: "SUBSCRIPTION_REQUIRED",
        message: "Active subscription required to perform this action",
        redirectTo: "/subscribe",
      });
      return;
    }

    // Has active subscription or is read-only GET request
    next();
  } catch (error) {
    console.error("Subscription guard error:", error);
    res.status(500).json({
      error: "INTERNAL_ERROR",
      message: "Internal server error",
    });
  }
}
