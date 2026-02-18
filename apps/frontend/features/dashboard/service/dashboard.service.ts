import { apiClient } from "@/lib/api/client";
import { handleApiError } from "@/lib/errors/handler";
import type { ApiSuccessResponse } from "@/lib/api/types";
import type { DashboardStats, DashboardStatsParams } from "../types/dashboard.types";
import { z } from "zod";

/**
 * Dashboard stats response schema
 */
const monthlyRevenueSchema = z.object({
  month: z.string(),
  revenue: z.number(),
});

const dashboardStatsSchema = z.object({
  totalInvoices: z.number(),
  paidInvoices: z.number(),
  pendingInvoices: z.number(),
  overdueInvoices: z.number(),
  thisWeekInvoices: z.number(),
  thisMonthInvoices: z.number(),
  totalRevenue: z.number(),
  monthlyRevenue: z.array(monthlyRevenueSchema),
  recentInvoices: z.array(z.any()), // Using z.any() since InvoiceResponse is complex
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


