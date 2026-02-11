import { Router } from "express";
import { processRequest } from "zod-express-middleware";
import { getDashboardStats } from "./dashboard.controller";
import { dashboardStatsSchema } from "./dashboard.schemas";
import asyncHandler from "../../core/async-handler";

/**
 * Dashboard routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const dashboardRoutes = Router();

// GET /api/v1/dashboard/stats - Get dashboard statistics
dashboardRoutes.get(
  "/stats",
  processRequest({ query: dashboardStatsSchema }),
  asyncHandler(getDashboardStats)
);


