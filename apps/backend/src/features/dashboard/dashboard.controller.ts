import { Response } from "express";
import * as dashboardService from "./dashboard.service";
import type { dashboardStatsSchema } from "./dashboard.schemas";
import { TypedRequest } from "zod-express-middleware";

/**
 * GET /dashboard/stats - Get dashboard statistics
 * No error handling needed - middleware handles it
 */
export async function getDashboardStats(
  req: TypedRequest<any, typeof dashboardStatsSchema, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const query = req.query;

  const result = await dashboardService.getDashboardStats(workspaceId, query);
  res.json({ data: result });
}


