import { Request, Response, NextFunction } from "express";
import { getAuth } from "@clerk/express";
import { prisma } from "./db";

// Extender Request para incluir usuario
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      workspaceId?: number;
    }
  }
}

/**
 * Middleware to verify workspace access and attach workspaceId to request
 * Must be used after requireAuth() from @clerk/express
 * This middleware extracts userId from Clerk's getAuth() and finds/creates the workspace
 */
export async function verifyWorkspaceAccess(
  req: Request,
  res: Response,
  next: NextFunction
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
        deletedAt: null,
      },
    });

    // If workspace doesn't exist (first time user), create it automatically
    if (!workspace) {
      workspace = await prisma.workspace.create({
        data: {
          clerkId: userId,
          name: "My Workspace",
        },
      });
    }

    // Attach userId and workspaceId to request
    req.userId = userId;
    req.workspaceId = workspace.id;

    next();
  } catch (error) {
    console.error("Workspace verification error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
}
