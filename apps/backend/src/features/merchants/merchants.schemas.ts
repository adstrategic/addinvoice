import { createMerchantSchema } from "@addinvoice/schemas";
import { z } from "zod";

/**
 * Schema for merchant entity
 */
export const merchantEntitySchema = createMerchantSchema.extend({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  sequence: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type MerchantEntity = z.infer<typeof merchantEntitySchema>;
