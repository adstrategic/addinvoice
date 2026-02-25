import { z } from "zod";

import { invoiceEntityWithRelationsSchema } from "../invoices/invoices.schemas.js";

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
  monthlyRevenue: z.array(monthlyRevenueSchema),
  overdueInvoices: z.number(),
  paidInvoices: z.number(),
  pendingInvoices: z.number(),
  recentInvoices: z.array(invoiceEntityWithRelationsSchema),
  thisMonthInvoices: z.number(),
  thisWeekInvoices: z.number(),
  totalInvoices: z.number(),
  totalRevenue: z.number(),
});

// DTO types
export type DashboardStatsQuery = z.infer<typeof dashboardStatsSchema>;
export type DashboardStatsResponse = z.infer<
  typeof dashboardStatsResponseSchema
>;
export type MonthlyRevenue = z.infer<typeof monthlyRevenueSchema>;
