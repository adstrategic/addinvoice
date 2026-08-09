import { z } from "zod";

/** Path param for a single preview page (1-based). */
export const previewPageNumberSchema = z.object({
  page: z.coerce.number().int().positive("Page must be a positive number"),
});

/** Query param tying the page to a content hash for immutable caching. */
export const previewHashQuerySchema = z.object({
  hash: z
    .string()
    .trim()
    .length(64, "hash must be a 64-character hex digest"),
});

export function withPreviewPageParams<T extends z.ZodRawShape>(
  base: z.ZodObject<T>,
) {
  return base.extend({
    page: z.coerce.number().int().positive("Page must be a positive number"),
  });
}
