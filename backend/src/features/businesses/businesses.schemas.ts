import { z } from "zod";

// ===== VALIDATION SCHEMAS (for middleware) =====

/**
 * Schema for listing businesses
 */
export const listBusinessesSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(30).optional().default(10),
  search: z.string().optional(),
});

/**
 * Schema for getting business by ID
 */
export const getBusinessByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

const defaultTaxModeEnum = z.enum(["NONE", "BY_PRODUCT", "BY_TOTAL"]);

const createBusinessSchemaBase = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Business name is required")
    .max(255, "Business name is too long"),
  nit: z
    .string({ required_error: "NIT/Tax ID is required" })
    .trim()
    .min(1, "NIT/Tax ID cannot be empty")
    .max(50, "NIT/Tax ID cannot exceed 50 characters"),
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
 * Schema for creating a business
 */
export const createBusinessSchema = createBusinessSchemaBase.superRefine(
  byTotalTaxSuperRefine,
);

/**
 * Schema for updating a business
 */
export const updateBusinessSchema = createBusinessSchemaBase
  .partial()
  .superRefine(byTotalTaxSuperRefine);

/**
 * Schema for setting default business
 */
export const setDefaultBusinessSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

/**
 * Business entity schema from API
 * Matches backend BusinessEntity structure
 */
export const businessEntitySchema = createBusinessSchemaBase.extend({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  isDefault: z.boolean(),
  sequence: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// ===== DTOs (for the service) =====

export type BusinessEntity = z.infer<typeof businessEntitySchema>;
export type ListBusinessesQuery = z.infer<typeof listBusinessesSchema>;
export type GetBusinessByIdParams = z.infer<typeof getBusinessByIdSchema>;
export type CreateBusinessDto = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>;
export type SetDefaultBusinessParams = z.infer<typeof setDefaultBusinessSchema>;
