import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import { getWorkspaceId } from "../../core/auth.js";
import {
  dashboardStatsResponseSchema,
  type dashboardStatsSchema,
} from "./dashboard.schemas.js";
import * as dashboardService from "./dashboard.service.js";

/**
 * GET /dashboard/stats - Get dashboard statistics
 * No error handling needed - middleware handles it
 */
export async function getDashboardStats(
  req: TypedRequest<never, typeof dashboardStatsSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const query = req.query;

  const result = await dashboardService.getDashboardStats(workspaceId, query);
  const parsed = dashboardStatsResponseSchema.parse(result);
  res.json({ data: parsed });
}
