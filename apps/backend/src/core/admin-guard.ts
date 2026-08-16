import type { NextFunction, Request, Response } from "express";

import { getAuth } from "@clerk/express";

import { UnauthorizedError } from "../errors/EntityErrors.js";

/**
 * Clerk user IDs allowed to reach admin-only routes.
 *
 * An env allowlist rather than a roles table: there is exactly one operator
 * today, and a role system would be infrastructure with no second user to
 * justify it. Revisit when admin access needs to be granted from the UI.
 */
function getAdminUserIds(): string[] {
  return (process.env.ADMIN_CLERK_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);
}

/**
 * Middleware restricting a route to allowlisted Clerk users.
 * Must run after requireAuth().
 *
 * Returns 401 rather than 403 for non-admins so the existence of admin routes
 * is not confirmed to a signed-in user who is not one.
 */
export function requireAdmin(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const { userId } = getAuth(req);
  const adminUserIds = getAdminUserIds();

  if (!userId || adminUserIds.length === 0 || !adminUserIds.includes(userId)) {
    next(new UnauthorizedError("Not found"));
    return;
  }

  next();
}
