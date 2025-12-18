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

/**
 * Schema for creating a business
 */
export const createBusinessSchema = z.object({
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
      "Phone must have a valid international format (e.g. +573011234567)"
    ),
  logo: z.string().url("Invalid logo URL").optional().nullable(),
});

/**
 * Schema for updating a business
 */
export const updateBusinessSchema = createBusinessSchema.partial();

/**
 * Schema for setting default business
 */
export const setDefaultBusinessSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

// ===== DTOs (for the service) =====

export type ListBusinessesQuery = z.infer<typeof listBusinessesSchema>;
export type GetBusinessByIdParams = z.infer<typeof getBusinessByIdSchema>;
export type CreateBusinessDto = z.infer<typeof createBusinessSchema>;
export type UpdateBusinessDto = z.infer<typeof updateBusinessSchema>;
export type SetDefaultBusinessParams = z.infer<typeof setDefaultBusinessSchema>;

// ===== ENTITY SCHEMA (domain model) =====

export type BusinessEntity = {
  id: number;
  workspaceId: number;
  name: string;
  nit: string;
  address: string;
  email: string;
  phone: string;
  logo: string | null;
  isDefault: boolean;
  sequence: number;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};









