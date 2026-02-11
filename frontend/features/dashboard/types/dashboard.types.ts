import type { InvoiceResponse } from "@/features/invoices";

/**
 * Monthly revenue data point
 */
export interface MonthlyRevenue {
  month: string;
  revenue: number;
}

/**
 * Dashboard statistics response
 */
export interface DashboardStats {
  totalInvoices: number;
  paidInvoices: number;
  pendingInvoices: number;
  overdueInvoices: number;
  thisWeekInvoices: number;
  thisMonthInvoices: number;
  totalRevenue: number;
  monthlyRevenue: MonthlyRevenue[];
  recentInvoices: InvoiceResponse[];
}

/**
 * Dashboard stats query parameters
 */
export interface DashboardStatsParams {
  businessId?: number;
}


