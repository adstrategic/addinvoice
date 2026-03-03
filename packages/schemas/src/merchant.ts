import { z } from "zod";

/**
 * Schema for creating a merchant.
 */
export const createMerchantSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Merchant name is required")
    .max(255, "Merchant name is too long"),
});

export const listMerchantsSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(30).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export type CreateMerchantInput = z.infer<typeof createMerchantSchema>;
export type ListMerchantsQuery = z.infer<typeof listMerchantsSchema>;
