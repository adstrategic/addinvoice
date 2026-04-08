import z from "zod";
import { businessBaseSchema } from "./business.base.js";

const byTotalTaxSuperRefine = (
  data: {
    defaultTaxMode?: string | null;
    defaultTaxName?: string | null;
    defaultTaxPercentage?: number | null;
  },
  ctx: z.RefinementCtx,
) => {
  if (data.defaultTaxMode !== "BY_TOTAL") return;
  if (data.defaultTaxName == null || data.defaultTaxName.trim().length === 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tax name is required when tax mode is by total",
      path: ["defaultTaxName"],
    });
  }
  if (
    data.defaultTaxPercentage == null ||
    data.defaultTaxPercentage < 0 ||
    data.defaultTaxPercentage > 100
  ) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Tax percentage is required when tax mode is by total",
      path: ["defaultTaxPercentage"],
    });
  }
};

/**
 * Business validation schema
 * Shared between frontend forms and backend API validation
 * Must match backend businesses.schemas.ts createBusinessSchema
 */
export const createBusinessSchema = businessBaseSchema.superRefine(
  byTotalTaxSuperRefine,
);

/**
 * Update business schema (all fields optional)
 */
export const updateBusinessSchema = businessBaseSchema
  .partial()
  .superRefine(byTotalTaxSuperRefine);

export type CreateBusinessDTO = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessDTO = z.infer<typeof updateBusinessSchema>;
