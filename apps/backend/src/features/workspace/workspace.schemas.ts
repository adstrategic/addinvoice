import { z } from "zod";

const paymentMethodTypeEnum = z.enum(["PAYPAL", "VENMO", "ZELLE", "STRIPE"]);

/**
 * Onboarding schemas
 */
export const onboardingAnswersSchema = z.record(z.string(), z.unknown());

export const upsertOnboardingSchema = z.object({
  answers: onboardingAnswersSchema,
});

export const onboardingResponseSchema = z.object({
  completedAt: z.string().datetime().nullable(),
  answers: onboardingAnswersSchema.nullable(),
});

/**
 * Schema for upserting a workspace payment method (PUT body)
 */
export const upsertPaymentMethodSchema = z.object({
  handle: z.string().trim().max(500).nullable().optional(),
  isEnabled: z.boolean(),
  // Stripe-specific — only used when type === "STRIPE"
  stripeSecretKey: z.string().trim().min(1).optional(),
});

/**
 * Response schema for a single payment method.
 * Note: stripeSecretKey is never returned — only stripeConnected is exposed.
 */
export const paymentMethodResponseSchema = z.object({
  handle: z.string().nullable(),
  id: z.number(),
  isEnabled: z.boolean(),
  stripeConnected: z.boolean(),
  stripeWebhookPending: z.boolean().optional(),
  type: paymentMethodTypeEnum,
});

/**
 * Params schema for PUT /workspace/payment-methods/:type
 */
export const upsertPaymentMethodParamsSchema = z.object({
  type: paymentMethodTypeEnum,
});

export type PaymentMethodResponse = z.infer<typeof paymentMethodResponseSchema>;
export type PaymentMethodType = z.infer<typeof paymentMethodTypeEnum>;
export type UpsertPaymentMethodDto = z.infer<typeof upsertPaymentMethodSchema>;
export type UpsertPaymentMethodParams = z.infer<
  typeof upsertPaymentMethodParamsSchema
>;
export type UpsertOnboardingDto = z.infer<typeof upsertOnboardingSchema>;

/**
 * Agent language preferences for the voice assistant
 */
export const agentLanguageEnum = z.enum(["es", "en", "fr", "pt", "de"]);

export const workspaceLanguageResponseSchema = z.object({
  language: agentLanguageEnum,
});

export const upsertWorkspaceLanguageSchema = z.object({
  language: agentLanguageEnum,
});

export type WorkspaceLanguageResponse = z.infer<
  typeof workspaceLanguageResponseSchema
>;
export type UpsertWorkspaceLanguageDto = z.infer<
  typeof upsertWorkspaceLanguageSchema
>;
