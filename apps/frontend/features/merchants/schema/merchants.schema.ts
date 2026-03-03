import { paginationMetaSchema } from "@/lib/api/types";
import { z } from "zod";

/** Merchant API response (frontend only; used when parsing API responses). */
export const merchantResponseSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  name: z.string(),
  sequence: z.number().int().positive(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const merchantResponseListSchema = z.object({
  data: z.array(merchantResponseSchema),
  pagination: paginationMetaSchema,
});

export type MerchantResponse = z.infer<typeof merchantResponseSchema>;
export type MerchantResponseList = z.infer<typeof merchantResponseListSchema>;
