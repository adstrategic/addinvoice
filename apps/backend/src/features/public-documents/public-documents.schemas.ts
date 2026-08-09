import z from "zod";

export const publicDocumentSlugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});

export const publicDocumentPreviewPageParamsSchema =
  publicDocumentSlugParamsSchema.extend({
    page: z.coerce.number().int().positive("Page must be a positive number"),
  });
