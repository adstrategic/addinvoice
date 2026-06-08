import { z } from "zod";
import { ClientBase } from "./client.base.js";

/**
 * Client response schema.
 * Same as ClientBase (flat entity with no nested relations).
 */
export const clientResponseSchema = ClientBase.extend({
  id: z.number().int().positive(),
  sequence: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  logo: z.string().url().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const clientListStatsSchema = z.object({
  /** Workspace-wide count; not scoped to list filters beyond search */
  total: z.number().int().nonnegative(),
  /** All clients (no inactive status in the model) */
  active: z.number().int().nonnegative(),
  /** Clients created in the current calendar month */
  newThisMonth: z.number().int().nonnegative(),
});

export const listClientsResponseSchema = z.object({
  data: z.array(clientResponseSchema),
  pagination: z.object({
    limit: z.number().int().positive(),
    page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
  stats: clientListStatsSchema,
});

export type ClientResponse = z.infer<typeof clientResponseSchema>;
export type ClientListStats = z.infer<typeof clientListStatsSchema>;
export type ListClientsResponse = z.infer<typeof listClientsResponseSchema>;
