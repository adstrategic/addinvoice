import { estimateDashboardResponseSchema } from "@addinvoice/schemas";
import { z } from "zod";
import { paginationMetaSchema } from "@/lib/api/types";

/**
 * Estimate list stats (aggregates for the filtered set)
 */
export const estimateListStatsSchema = z.object({
  total: z.number(),
  paidCount: z.number(),
  pendingCount: z.number(),
  revenue: z.number(),
  totalEstimated: z.number(),
  outstanding: z.number(),
});

/**
 * Estimate list response schema with pagination and stats
 */
export const estimateResponseListSchema = z.object({
  data: z.array(estimateDashboardResponseSchema),
  pagination: paginationMetaSchema,
  stats: estimateListStatsSchema,
});

export type EstimateResponseList = z.infer<typeof estimateResponseListSchema>;
export type EstimateListStatsResponse = z.infer<typeof estimateListStatsSchema>;

/**
 * Selected payment method on estimate (from API) - frontend-only if needed
 */
export const estimateSelectedPaymentMethodSchema = z.object({
  id: z.number().int().positive(),
  type: z.enum(["PAYPAL", "VENMO", "ZELLE", "NEQUI", "STRIPE"]),
  handle: z.string().nullable(),
  isEnabled: z.boolean(),
});
