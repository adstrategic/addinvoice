import { z } from "zod";

import { businessEntitySchema } from "../businesses/businesses.schemas.js";

// ===== VALIDATION SCHEMAS (for middleware) =====

/**
 * Schema for listing catalogs
 */
export const listCatalogsSchema = z.object({
  businessId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(30).optional().default(10),
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
  sortBy: z.enum(["sequence", "name", "price"]).optional().default("sequence"),
  sortOrder: z.enum(["asc", "desc"]).optional().default("asc"),
});

/**
 * Schema for getting catalog by sequence
 */
export const getCatalogBySequenceSchema = z.object({
  sequence: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

/**
 * Schema for getting catalog by ID (for update/delete)
 */
export const getCatalogByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

/**
 * Schema for creating a catalog
 */
export const createCatalogSchema = z.object({
  businessId: z.number().int().positive("Business is required"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(1000, "Description is too long"),
  name: z
    .string()
    .trim()
    .min(1, "Catalog name is required")
    .max(255, "Catalog name is too long"),
  price: z.coerce.number().positive("Price must be a positive number"),
  quantityUnit: z.enum(["DAYS", "HOURS", "UNITS"]),
});

/**
 * Body for POST /catalog/from-voice-audio (multipart/form-data).
 */
export const fromVoiceAudioBodySchema = z.object({
  businessId: z.coerce.number().int().positive("Business is required"),
});

/**
 * Schema for catalog entity
 */
export const catalogEntitySchema = createCatalogSchema.extend({
  business: businessEntitySchema,
  createdAt: z.date(),
  id: z.number().int().positive(),
  sequence: z.number().int().positive(),
  updatedAt: z.date(),

  workspaceId: z.number().int().positive(),
});

/**
 * Schema for updating a catalog
 */
export const updateCatalogSchema = createCatalogSchema.partial();

// ===== DTOs (for the service) =====

export type CatalogEntity = z.infer<typeof catalogEntitySchema>;
export type CreateCatalogDto = z.infer<typeof createCatalogSchema>;
export type GetCatalogByIdParams = z.infer<typeof getCatalogByIdSchema>;
export type GetCatalogBySequenceParams = z.infer<
  typeof getCatalogBySequenceSchema
>;
export type ListCatalogsQuery = z.infer<typeof listCatalogsSchema>;
export type UpdateCatalogDto = z.infer<typeof updateCatalogSchema>;
