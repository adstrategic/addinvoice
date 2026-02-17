import { z } from "zod";

export const paymentMethodTypeEnum = z.enum(["PAYPAL", "VENMO", "ZELLE"]);
export type PaymentMethodType = z.infer<typeof paymentMethodTypeEnum>;

/**
 * Single workspace payment method from API
 */
export const paymentMethodSchema = z.object({
  id: z.number(),
  type: paymentMethodTypeEnum,
  handle: z.string().nullable(),
  isEnabled: z.boolean(),
});

/**
 * DTO for upserting a payment method (PUT body)
 */
export const upsertPaymentMethodSchema = z.object({
  handle: z.string().trim().max(500).nullable().optional(),
  isEnabled: z.boolean(),
});

export type PaymentMethod = z.infer<typeof paymentMethodSchema>;
export type UpsertPaymentMethodDto = z.infer<typeof upsertPaymentMethodSchema>;
