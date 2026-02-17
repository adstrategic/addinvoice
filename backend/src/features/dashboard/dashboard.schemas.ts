import { z } from "zod";
import { invoiceEntityWithRelationsSchema } from "../invoices/invoices.schemas";

/**
 * Schema for dashboard stats query parameters
 */
export const dashboardStatsSchema = z.object({
  businessId: z.coerce.number().int().positive().optional(),
});

/**
 * Monthly revenue data point
 */
export const monthlyRevenueSchema = z.object({
  month: z.string(),
  revenue: z.number(),
});

/**
 * Dashboard stats response schema
 */
export const dashboardStatsResponseSchema = z.object({
  totalInvoices: z.number(),
  paidInvoices: z.number(),
  pendingInvoices: z.number(),
  overdueInvoices: z.number(),
  thisWeekInvoices: z.number(),
  thisMonthInvoices: z.number(),
  totalRevenue: z.number(),
  monthlyRevenue: z.array(monthlyRevenueSchema),
  recentInvoices: z.array(invoiceEntityWithRelationsSchema),
});

// DTO types
export type DashboardStatsQuery = z.infer<typeof dashboardStatsSchema>;
export type MonthlyRevenue = z.infer<typeof monthlyRevenueSchema>;
export type DashboardStatsResponse = z.infer<
  typeof dashboardStatsResponseSchema
>;
