import { z } from "zod";

export const paymentMethodTypeEnum = z.enum([
  "PAYPAL",
  "VENMO",
  "ZELLE",
  "NEQUI",
  "STRIPE",
]);
export type PaymentMethodType = z.infer<typeof paymentMethodTypeEnum>;

/**
 * Agent language preferences for the voice assistant
 */
export const agentLanguageEnum = z.enum(["es", "en", "fr", "pt", "de"]);
export type AgentLanguage = z.infer<typeof agentLanguageEnum>;

export const workspaceLanguageResponseSchema = z.object({
  language: agentLanguageEnum,
});
export type WorkspaceLanguageResponse = z.infer<
  typeof workspaceLanguageResponseSchema
>;

export const upsertWorkspaceLanguageSchema = z.object({
  language: agentLanguageEnum,
});
export type UpsertWorkspaceLanguageDto = z.infer<
  typeof upsertWorkspaceLanguageSchema
>;

/**
 * Single workspace payment method from API.
 * Note: stripeSecretKey is never returned — only stripeConnected is exposed.
 */
export const paymentMethodSchema = z.object({
  id: z.number(),
  type: paymentMethodTypeEnum,
  handle: z.string().nullable(),
  isDefault: z.boolean().default(false),
  isEnabled: z.boolean(),
  stripeConnected: z.boolean().default(false),
  stripeWebhookPending: z.boolean().optional(),
});

/**
 * DTO for upserting a payment method (PUT body)
 */
export const upsertPaymentMethodSchema = z.object({
  handle: z.string().trim().max(500).nullable().optional(),
  isEnabled: z.boolean(),
  // Stripe-specific — only sent when type === "STRIPE"
  stripeSecretKey: z.string().optional(),
});

export const setDefaultPaymentMethodSchema = z.object({
  paymentMethodId: z.number().int().positive().nullable(),
});

export const setDefaultPaymentMethodResponseSchema = z.object({
  defaultPaymentMethodId: z.number().int().positive().nullable(),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type UpsertPaymentMethodDto = z.infer<typeof upsertPaymentMethodSchema>;
export type SetDefaultPaymentMethodDto = z.infer<
  typeof setDefaultPaymentMethodSchema
>;
export type SetDefaultPaymentMethodResponse = z.infer<
  typeof setDefaultPaymentMethodResponseSchema
>;
