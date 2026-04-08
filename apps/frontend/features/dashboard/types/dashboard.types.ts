import type { InvoiceResponse } from "@/features/invoices";

/**
 * Chart series point (label = day "Mar 12" or month "Jan")
 */
export interface ChartSeriesPoint {
  label: string;
  revenue: number;
}

/**
 * Dashboard statistics response
 */
export interface DashboardStats {
  chartSeries: ChartSeriesPoint[];
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  thisWeekInvoices: number;
  thisMonthInvoices: number;
  totalOutstanding: number;
  totalRevenue: number;
  recentInvoices: InvoiceResponse[];
}

/**
 * Dashboard stats query parameters
 */
export interface DashboardStatsParams {
  businessId?: number;
  period?: "7d" | "30d" | "6m" | "12m";
}


