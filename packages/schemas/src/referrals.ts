import z from "zod";

/**
 * Referral codes are case-insensitive for the user and stored uppercase.
 * Restricted to A-Z/0-9 so they stay safe in a URL path without encoding.
 */
export const referralCodeSchema = z
  .string()
  .trim()
  .min(3)
  .max(32)
  .regex(/^[a-zA-Z0-9]+$/, "Referral code may only contain letters and numbers")
  .transform((code) => code.toUpperCase());

/**
 * Params for the public code lookup: GET /public/referrals/:code
 */
export const getReferralByCodeSchema = z.object({
  code: referralCodeSchema,
});

/**
 * Body for attaching a referral to the caller's workspace:
 * POST /referrals/attach
 */
export const attachReferralSchema = z.object({
  code: referralCodeSchema,
});

/**
 * Params for the admin referrer detail view.
 */
export const getReferrerByIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type AttachReferralBody = z.infer<typeof attachReferralSchema>;
export type GetReferralByCodeParams = z.infer<typeof getReferralByCodeSchema>;
export type GetReferrerByIdParams = z.infer<typeof getReferrerByIdSchema>;
