import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "../service/dashboard.service";
import type { DashboardStatsParams } from "../types/dashboard.types";

/**
 * Query key factory for dashboard queries
 * Follows TanStack Query best practices for key management
 */
export const dashboardKeys = {
  all: ["dashboard"] as const,
  stats: (params?: DashboardStatsParams) =>
    [...dashboardKeys.all, "stats", params] as const,
};

/**
 * Hook to fetch dashboard statistics
 */
export function useDashboardStats(params?: DashboardStatsParams) {
  return useQuery({
    queryKey: dashboardKeys.stats(params),
    queryFn: () => dashboardService.getStats(params),
    staleTime: 30 * 1000, // 30 seconds
  });
}


