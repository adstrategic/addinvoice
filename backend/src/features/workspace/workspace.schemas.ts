import { z } from "zod";

const paymentMethodTypeEnum = z.enum(["PAYPAL", "VENMO", "ZELLE"]);

/**
 * Schema for upserting a workspace payment method (PUT body)
 */
export const upsertPaymentMethodSchema = z.object({
  handle: z.string().trim().max(500).nullable().optional(),
  isEnabled: z.boolean(),
});

/**
 * Response schema for a single payment method
 */
export const paymentMethodResponseSchema = z.object({
  id: z.number(),
  type: paymentMethodTypeEnum,
  handle: z.string().nullable(),
  isEnabled: z.boolean(),
});

/**
 * Params schema for PUT /workspace/payment-methods/:type
 */
export const upsertPaymentMethodParamsSchema = z.object({
  type: paymentMethodTypeEnum,
});

export type UpsertPaymentMethodDto = z.infer<typeof upsertPaymentMethodSchema>;
export type PaymentMethodResponse = z.infer<typeof paymentMethodResponseSchema>;
export type UpsertPaymentMethodParams = z.infer<
  typeof upsertPaymentMethodParamsSchema
>;
