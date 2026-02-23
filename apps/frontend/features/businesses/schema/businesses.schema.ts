import { paginationMetaSchema } from "@/lib/api/types";
import { nullableOptional } from "@/lib/utils";
import { z } from "zod";

/**
 * Schema for listing businesses
 */
export const listBusinessesSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().max(30).optional(),
  search: z.string().optional(),
});

const defaultTaxModeEnum = z.enum(["NONE", "BY_PRODUCT", "BY_TOTAL"]);

const createBusinessSchemaBase = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Business name is required")
    .max(255, "Business name is too long"),
  nit: nullableOptional(
    z
      .string()
      .trim()
      .max(50, "NIT/Tax ID cannot exceed 50 characters")
      .optional(),
  ),
  address: z
    .string({ required_error: "Address is required" })
    .trim()
    .min(1, "Address cannot be empty")
    .max(500, "Address cannot exceed 500 characters"),
  email: z.string().trim().email("Invalid email address"),
  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone must have a valid international format (e.g. +573011234567)",
    ),
  logo: z.string().url("Invalid logo URL").optional().nullable(),
  defaultTaxMode: defaultTaxModeEnum.optional().nullable(),
  defaultTaxName: z.string().trim().optional().nullable(),
  defaultTaxPercentage: z.number().min(0).max(100).optional().nullable(),
  defaultNotes: z.string().optional().nullable(),
  defaultTerms: z.string().optional().nullable(),
});

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
export const createBusinessSchema = createBusinessSchemaBase.superRefine(
  byTotalTaxSuperRefine,
);

/**
 * Update business schema (all fields optional)
 */
export const updateBusinessSchema = createBusinessSchemaBase
  .partial()
  .superRefine(byTotalTaxSuperRefine);

/**
 * Business response schema from API
 * Matches backend BusinessEntity structure
 */
export const businessResponseSchema = createBusinessSchemaBase.extend({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  isDefault: z.boolean(),
  sequence: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

/**
 * Business list response schema with pagination
 */
export const businessResponseListSchema = z.object({
  data: z.array(businessResponseSchema),
  pagination: paginationMetaSchema,
});

// DTO types
export type CreateBusinessDto = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>;
export type BusinessResponse = z.infer<typeof businessResponseSchema>;
export type BusinessResponseList = z.infer<typeof businessResponseListSchema>;
export type ListBusinessesParams = z.infer<typeof listBusinessesSchema>;
