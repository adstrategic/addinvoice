import { paginationMetaSchema } from "@/lib/api/types";
import { z } from "zod";

export const workCategoryResponseSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  name: z.string(),
  sequence: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const workCategoryResponseListSchema = z.object({
  data: z.array(workCategoryResponseSchema),
  pagination: paginationMetaSchema,
});

export type WorkCategoryResponse = z.infer<typeof workCategoryResponseSchema>;
export type WorkCategoryResponseList = z.infer<
  typeof workCategoryResponseListSchema
>;
