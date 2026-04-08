import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type { DashboardStats, DashboardStatsParams } from "../types/dashboard.types";
import { z } from "zod";

const chartSeriesPointSchema = z.object({
  label: z.string(),
  revenue: z.number(),
});

const dashboardStatsSchema = z.object({
  chartSeries: z.array(chartSeriesPointSchema),
  totalInvoices: z.number(),
  paidInvoices: z.number(),
  pendingInvoices: z.number(),
  overdueInvoices: z.number(),
  thisWeekInvoices: z.number(),
  thisMonthInvoices: z.number(),
  totalOutstanding: z.number(),
  totalRevenue: z.number(),
  recentInvoices: z.array(z.any()),
});

/**
 * Base URL for dashboard API endpoints
 */
const BASE_URL = "/dashboard";

/**
 * Dashboard Service
 * Handles all API calls for dashboard feature
 */
async function getDashboardStats(
  params?: DashboardStatsParams
): Promise<DashboardStats> {
  try {
    const { data } = await apiClient.get<ApiSuccessResponse<DashboardStats>>(
      `${BASE_URL}/stats`,
      {
        params: {
          businessId: params?.businessId,
          period: params?.period,
        },
      }
    );

    return dashboardStatsSchema.parse(data.data);
  } catch (error) {
    console.error(error);
    handleApiError(error);
  }
}

/**
 * Service object for backward compatibility
 * for use in hooks and components
 */
export const dashboardService = {
  getStats: getDashboardStats,
};


