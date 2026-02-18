/**
 * Dashboard Feature
 * Public exports for dashboard feature
 */

// Types
export type {
  DashboardStats,
  DashboardStatsParams,
  MonthlyRevenue,
} from "./types/dashboard.types";

// Service
export { dashboardService } from "./service/dashboard.service";

// Hooks
export { useDashboardStats, dashboardKeys } from "./hooks/useDashboard";


