import { z } from "zod";

import { invoiceEntityWithRelationsSchema } from "../invoices/invoices.schemas.js";

const periodSchema = z.enum(["7d", "30d", "6m", "12m"]);

/**
 * Schema for dashboard stats query parameters
 */
export const dashboardStatsSchema = z.object({
  businessId: z.coerce.number().int().positive().optional(),
  period: periodSchema.optional(),
});

/**
 * Monthly revenue data point
 */
export const monthlyRevenueSchema = z.object({
  month: z.string(),
  revenue: z.number(),
});

/**
 * Chart series point (label = day "Mar 12" or month "Jan")
 */
export const chartSeriesPointSchema = z.object({
  label: z.string(),
  revenue: z.number(),
});

/**
 * Dashboard stats response schema
 */
export const dashboardStatsResponseSchema = z.object({
  chartSeries: z.array(chartSeriesPointSchema),
  overdueInvoices: z.number(),
  paidInvoices: z.number(),
  pendingInvoices: z.number(),
  recentInvoices: z.array(invoiceEntityWithRelationsSchema),
  thisMonthInvoices: z.number(),
  thisWeekInvoices: z.number(),
  totalInvoices: z.number(),
  totalOutstanding: z.number(),
  totalRevenue: z.number(),
});

// DTO types
export type DashboardStatsQuery = z.infer<typeof dashboardStatsSchema>;
export type DashboardStatsResponse = z.infer<
  typeof dashboardStatsResponseSchema
>;
export type MonthlyRevenue = z.infer<typeof monthlyRevenueSchema>;
export type ChartSeriesPoint = z.infer<typeof chartSeriesPointSchema>;
