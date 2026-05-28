import z from "zod";

export const sharePublicLinkResponseSchema = z.object({
  publicSlug: z.string(),
});

export type SharePublicLinkResponse = z.infer<typeof sharePublicLinkResponseSchema>;
