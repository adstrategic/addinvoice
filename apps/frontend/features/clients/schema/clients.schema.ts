import { paginationMetaSchema } from "@/lib/api/types";
import { clientResponseSchema } from "@addinvoice/schemas";
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
 * Client response schema from API
 * Matches backend ClientEntity structure
 */
// export const clientResponseSchema = createClientSchema.extend({
//   id: z.number().int().positive(),
//   sequence: z.number().int().positive(),
//   workspaceId: z.number().int().positive(),
//   createdAt: z.string().datetime(),
//   updatedAt: z.string().datetime(),
// });

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

export type ClientResponseList = z.infer<typeof clientResponseListSchema>;
export type ListClientsParams = z.infer<typeof listClientsSchema>;
