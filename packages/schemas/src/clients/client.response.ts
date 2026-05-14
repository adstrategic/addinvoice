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

export type ClientResponse = z.infer<typeof clientResponseSchema>;
