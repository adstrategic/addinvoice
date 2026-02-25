import type { NextFunction, Request, Response } from "express";

import { prisma } from "@addinvoice/db";
import { getAuth } from "@clerk/express";

// Extend Express Request with auth fields (namespace required for declaration merging)
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace -- Express Request augmentation
  namespace Express {
    interface Request {
      userId?: string;
      workspaceId?: number;
    }
  }
}

/**
 * Get workspaceId from request. Use in route handlers that run after verifyWorkspaceAccess.
 * Throws if workspace was not resolved (e.g. middleware not applied).
 */
export function getWorkspaceId(req: { workspaceId?: number }): number {
  if (req.workspaceId == null) {
    throw new Error("Workspace not found");
  }
  return req.workspaceId;
}

/**
 * Middleware to verify workspace access and attach workspaceId to request
 * Must be used after requireAuth() from @clerk/express
 * This middleware extracts userId from Clerk's getAuth() and finds/creates the workspace
 */
export async function verifyWorkspaceAccess(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    // Get auth from Clerk (requires clerkMiddleware to be applied first)
    const { userId } = getAuth(req);

    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    // Find user's workspace using Clerk's userId directly
    let workspace = await prisma.workspace.findFirst({
      where: {
        clerkId: userId,
      },
    });

    // If workspace doesn't exist (first time user), create it automatically
    workspace ??= await prisma.workspace.create({
      data: {
        clerkId: userId,
        name: "My Workspace",
      },
    });

    // Attach userId and workspaceId to request
    req.userId = userId;
    req.workspaceId = workspace.id;

    next();
  } catch (error) {
    console.error("Workspace verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
