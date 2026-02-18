import { z } from "zod";
import { createClientSchema } from "@addinvoice/schemas";

// Re-export for consumers that only need the shared schema
export { createClientSchema };

// ===== VALIDATION SCHEMAS (for middleware) =====

/**
 * Schema for listing clients
 */
export const listClientsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(30).optional().default(10),
  search: z.string().optional(),
});

/**
 * Schema for getting client by sequence
 */
export const getClientBySequenceSchema = z.object({
  sequence: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

/**
 * Schema for getting client by ID (for update/delete)
 */
export const getClientByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

/**
 * Schema for client entity
 */
export const clientEntitySchema = createClientSchema.extend({
  id: z.number().int().positive(),
  sequence: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for updating a client
 */
export const updateClientSchema = createClientSchema.partial();

// ===== DTOs (for the service) =====

export type ClientEntity = z.infer<typeof clientEntitySchema>;
export type ListClientsQuery = z.infer<typeof listClientsSchema>;
export type GetClientBySequenceParams = z.infer<
  typeof getClientBySequenceSchema
>;
export type GetClientByIdParams = z.infer<typeof getClientByIdSchema>;
export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;
