import z from "zod";
import { baseEstimateSchema, baseEstimateItemSchema } from "./estimate.base.js";
import { EstimateStatusEnum } from "./estimate.base.js";
import { clientResponseSchema } from "../clients/client.response.js";
import { businessResponseSchema } from "../businesses/business.response.js";
import { AcceptedBy } from "../enums.js";
import { fixedDateFromPrisma } from "../shared/date.js";

/**
 * Estimate item as returned by API (with id, estimateId, total, timestamps).
 */
export const estimateItemResponseSchema = baseEstimateItemSchema.extend({
  id: z.number().int().positive(),
  estimateId: z.number().int().positive(),
  total: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Estimate response schema (single estimate with relations).
 * Uses flat ClientBase and BusinessBase to avoid circular deps.
 */
export const estimateResponseSchema = baseEstimateSchema.extend({
  timelineStartDate: z
    .string()
    .transform((val) => fixedDateFromPrisma(new Date(val)))
    .nullable(),
  timelineEndDate: z
    .string()
    .transform((val) => fixedDateFromPrisma(new Date(val)))
    .nullable(),
  id: z.number().int().positive(),
  sequence: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  subtotal: z.number(),
  totalTax: z.number(),
  total: z.number(),
  status: EstimateStatusEnum,
  requireSignature: z.boolean().optional(),
  rejectionReason: z.string().nullable().optional(),
  signingToken: z.string().nullable().optional(),
  signatureData: z.unknown().nullable().optional(),
  acceptedAt: z.coerce.date().nullable().optional(),
  acceptedBy: z.nativeEnum(AcceptedBy).nullable().optional(),
  sentAt: z.coerce.date().nullable(),
  viewedAt: z.coerce.date().nullable().optional(),
  paidAt: z.coerce.date().nullable().optional(),
  paymentLink: z.string().nullable().optional(),
  paymentProvider: z.string().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  business: businessResponseSchema,
  client: clientResponseSchema,
  items: z.array(estimateItemResponseSchema).optional(),
});

export const estimateDashboardResponseSchema = estimateResponseSchema
  .omit({
    items: true,
  })
  .extend({
    /** Present on list responses so UI can show Send only when estimate has items */
    itemCount: z.number().int().min(0),
  });

export const publicEstimateSummarySchema = estimateResponseSchema.omit({
  createdAt: true,
  updatedAt: true,
  workspaceId: true,
  rejectionReason: true,
  acceptedAt: true,
  acceptedBy: true,
  sentAt: true,
  viewedAt: true,
  paidAt: true,
  paymentLink: true,
  paymentProvider: true,
});

export type EstimateItemResponse = z.infer<typeof estimateItemResponseSchema>;
export type EstimateDashboardResponse = z.infer<
  typeof estimateDashboardResponseSchema
>;
export type EstimateResponse = z.infer<typeof estimateResponseSchema>;
export type PublicEstimateSummary = z.infer<typeof publicEstimateSummarySchema>;
