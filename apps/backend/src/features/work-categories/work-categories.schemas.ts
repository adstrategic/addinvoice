import { createWorkCategorySchema } from "@addinvoice/schemas";
import { z } from "zod";

/**
 * Schema for work category entity
 */
export const workCategoryEntitySchema = createWorkCategorySchema.extend({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  sequence: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type WorkCategoryEntity = z.infer<typeof workCategoryEntitySchema>;
