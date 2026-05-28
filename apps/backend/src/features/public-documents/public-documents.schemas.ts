import z from "zod";

export const publicDocumentSlugParamsSchema = z.object({
  slug: z.string().trim().min(1),
});
