import z from "zod";

/**
 * Schema for listing work categories (search, limit, page).
 */
export const listWorkCategoriesSchema = z.object({
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(30).optional(),
  page: z.coerce.number().int().min(1).optional(),
});

export type ListWorkCategoriesQuery = z.infer<typeof listWorkCategoriesSchema>;
