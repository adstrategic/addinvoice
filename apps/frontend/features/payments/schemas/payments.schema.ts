import { z } from "zod";
import { paginationMetaSchema } from "@/lib/api/types";

import { nullableOptional } from "@/lib/utils";
import { clientResponseSchema } from "@/features/clients";
import { businessResponseSchema } from "@/features/businesses";

/**
 * Payment schema
 */
export const createPaymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: nullableOptional(
    z.string().trim().max(255, "Transaction ID is too long"),
  ),
  paidAt: z.coerce.date(),
  details: z.string().optional().nullable(),
  sendReceipt: z.boolean().optional(),
});

/**
 * Payment update schema
 */
export const updatePaymentSchema = createPaymentSchema.partial();

/**
 * Payment response schema from API
 * Matches PaymentEntity from backend
 */
export const paymentResponseSchema = createPaymentSchema.extend({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  invoiceId: z.number().int().positive(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Minimal invoice shape returned with payment list (subset of full invoice entity).
 * Use this for list responses; use full invoice types for get-by-id when needed.
 */
const paymentInvoiceRelationForListSchema = z
  .object({
    sequence: z.number().int().positive(),
    invoiceNumber: z.string(),
    currency: z.string(),
    total: z.number(),
    balance: z.number(),
    status: z.string(),
    clientEmail: z.string(),
  })
  .extend({
    client: clientResponseSchema.pick({
      id: true,
      name: true,
      businessName: true,
    }),
    business: businessResponseSchema.pick({
      id: true,
      name: true,
    }),
  });

/**
 * Payment list item (from GET /payments)
 */
export const paymentListResponseSchema = paymentResponseSchema.extend({
  invoice: paymentInvoiceRelationForListSchema,
});

/**
 * Payment list response with pagination
 */
export const paymentListResponseListSchema = z.object({
  data: z.array(paymentListResponseSchema),
  pagination: paginationMetaSchema,
  totalAmount: z.number(),
  totalCount: z.number(),
});

export type PaymentListResponse = z.infer<typeof paymentListResponseSchema>;
export type PaymentListResponseList = z.infer<
  typeof paymentListResponseListSchema
>;

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentDto = z.infer<typeof updatePaymentSchema>;
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
