import { businessResponseSchema } from "@/features/businesses";
import { paginationMetaSchema } from "@/lib/api/types";
import { z } from "zod";

/**
 * Schema for listing catalogs
 */
export const listCatalogsSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().max(30).optional(),
  search: z.string().optional(),
  businessId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(["sequence", "name", "price"]).optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});

/**
 * Catalog validation schema
 * Shared between frontend forms and backend API validation
 * Must match backend catalog.schemas.ts createCatalogSchema
 */
export const createCatalogSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Catalog name is required")
    .max(255, "Catalog name is too long"),
  description: z
    .string()
    .trim()
    .min(1, "Description is required")
    .max(1000, "Description is too long"),
  price: z.coerce.number().positive("Price must be a positive number"),
  quantityUnit: z.enum(["DAYS", "HOURS", "UNITS"]),
  businessId: z.number().int().positive("Business is required"),
});

/**
 * Update catalog schema (all fields optional except businessId which cannot be changed)
 */
export const updateCatalogSchema = createCatalogSchema
  .partial()
  .omit({ businessId: true });

/**
 * Catalog response schema from API
 * Matches backend CatalogEntity structure
 */
export const catalogResponseSchema = createCatalogSchema.extend({
  id: z.number().int().positive(),
  sequence: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  business: businessResponseSchema,
});

/**
 * Array schema for catalog list responses
 * {
 *   "data": [...],
 *   "pagination": {
 *     "total": 100,
 *     "page": 1,
 *     "limit": 10,
 *     "totalPages": 10
 *   }
 * }
 */
export const catalogResponseListSchema = z.object({
  data: z.array(catalogResponseSchema),
  pagination: paginationMetaSchema,
});

// DTO types
export type CreateCatalogDto = z.infer<typeof createCatalogSchema>;
export type UpdateCatalogDto = z.infer<typeof updateCatalogSchema>;
export type CatalogResponse = z.infer<typeof catalogResponseSchema>;
export type CatalogResponseList = z.infer<typeof catalogResponseListSchema>;
export type ListCatalogsParams = z.infer<typeof listCatalogsSchema>;
