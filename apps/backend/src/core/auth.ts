import type { NextFunction, Request, Response } from "express";

import { Prisma, prisma } from "@addinvoice/db";
import { getAuth } from "@clerk/express";

import { InternalError, UnauthorizedError } from "../errors/EntityErrors.js";

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
 * Create the workspace for a first-time user, tolerating a concurrent creator.
 *
 * The surrounding find-then-create is not atomic, so parallel first requests
 * (the mobile app opens three at once on cold start) can both see no workspace
 * and both insert. The loser hits the unique constraint on clerkId; that means
 * the row now exists, so re-read it instead of failing the request.
 */
async function createWorkspaceForClerkUser(userId: string) {
  try {
    return await prisma.workspace.create({
      data: {
        clerkId: userId,
        name: "My Workspace",
        language: "en",
        usage: { create: {} },
      },
    });
  } catch (error) {
    const isDuplicate =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";

    if (!isDuplicate) throw error;

    return await prisma.workspace.findFirstOrThrow({
      where: { clerkId: userId },
    });
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
  next: NextFunction,
): Promise<void> {
  try {
    // Get auth from Clerk (requires clerkMiddleware to be applied first)
    const { userId } = getAuth(req);

    if (!userId) {
      next(new UnauthorizedError("Unauthorized"));
      return;
    }

    // Find user's workspace using Clerk's userId directly
    let workspace = await prisma.workspace.findFirst({
      where: {
        clerkId: userId,
      },
    });

    // If workspace doesn't exist (first time user), create it automatically
    // along with its usage row so limit guards always have a row to update.
    workspace ??= await createWorkspaceForClerkUser(userId);

    // Attach userId and workspaceId to request
    req.userId = userId;
    req.workspaceId = workspace.id;

    next();
  } catch (error) {
    console.error("Workspace verification error:", error);
    next(new InternalError("Internal server error"));
  }
}
