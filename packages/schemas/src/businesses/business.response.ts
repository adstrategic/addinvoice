import z from "zod";
import { businessBaseSchema } from "./business.base.js";

/**
 * Flat business shape (base layer).
 * Used for estimate response relations. No nested relations.
 */
export const businessResponseSchema = businessBaseSchema.extend({
  id: z.number().int().positive(),
  sequence: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  isDefault: z.boolean(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export type BusinessResponse = z.infer<typeof businessResponseSchema>;
