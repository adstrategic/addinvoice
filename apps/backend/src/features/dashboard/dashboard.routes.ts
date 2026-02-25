import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import { getDashboardStats } from "./dashboard.controller.js";
import { dashboardStatsSchema } from "./dashboard.schemas.js";

/**
 * Dashboard routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const dashboardRoutes: Router = Router();

// GET /api/v1/dashboard/stats - Get dashboard statistics
dashboardRoutes.get(
  "/stats",
  processRequest({ query: dashboardStatsSchema }),
  asyncHandler(getDashboardStats),
);
