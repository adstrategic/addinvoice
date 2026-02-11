import { paginationMetaSchema } from "@/lib/api/types";
import { nullableOptional } from "@/lib/utils";
import { z } from "zod";

/**
 * Schema for listing clients
 */
export const listClientsSchema = z.object({
  page: z.coerce.number().int().optional(),
  limit: z.coerce.number().int().max(30).optional(),
  search: z.string().optional(),
});

/**
 * Client validation schema
 * Shared between frontend forms and backend API validation
 * Must match backend clients.schemas.ts createClientSchema
 */
export const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Client name is required")
    .max(255, "Client name is too long"),
  email: z.string().trim().email("Invalid email address"),
  phone: nullableOptional(
    z
      .string()
      .trim()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        "The phone must have a valid international format (e.g. +573011234567)"
      )
  ),
  address: nullableOptional(
    z.string().trim().max(100, "Address cannot exceed 100 characters")
  ),
  nit: nullableOptional(
    z.string().trim().max(15, "NIT/Cedula cannot exceed 15 characters")
  ),
  businessName: nullableOptional(
    z.string().trim().max(100, "Business name cannot exceed 100 characters")
  ),
});

/**
 * Update client schema (all fields optional)
 */
export const updateClientSchema = createClientSchema.partial();

/**
 * Client response schema from API
 * Matches backend ClientEntity structure
 */
export const clientResponseSchema = createClientSchema.extend({
  id: z.number().int().positive(),
  sequence: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
  deletedAt: z.string().datetime().nullable(),
});

/**
 * Array schema for client list responses
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
export const clientResponseListSchema = z.object({
  data: z.array(clientResponseSchema),
  pagination: paginationMetaSchema,
});

// DTO types
export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;
export type ClientResponse = z.infer<typeof clientResponseSchema>;
export type ClientResponseList = z.infer<typeof clientResponseListSchema>;
export type ListClientsParams = z.infer<typeof listClientsSchema>;
