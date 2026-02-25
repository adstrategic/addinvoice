import { z } from "zod";

import { businessEntitySchema } from "../businesses/businesses.schemas.js";
import { clientEntitySchema } from "../clients/clients.schemas.js";

/**
 * Query schema for listing payments
 */
export const listPaymentsSchema = z.object({
  businessId: z.coerce.number().int().positive().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
});

/**
 * Params schema for getting payment by ID
 */
export const getPaymentByIdSchema = z.object({
  id: z.coerce
    .number()
    .int()
    .positive("The payment ID must be a positive number"),
});

/**
 * Schema for creating a payment
 */
export const createPaymentSchema = z.object({
  amount: z.coerce
    .number()
    .positive("Payment amount must be greater than 0")
    .or(z.string().transform((val) => parseFloat(val))),
  details: z.string().trim().max(1000).nullish(),
  paidAt: z.coerce.date().optional(),
  paymentMethod: z
    .string()
    .trim()
    .min(1, "Payment method is required")
    .max(50, "Payment method is too long"),
  /** If true, enqueue sending a payment receipt email. Not persisted. */
  sendReceipt: z.boolean().optional(),
  transactionId: z
    .string()
    .trim()
    .max(255, "Transaction ID is too long")
    .nullish(),
});

/**
 * Schema for payment entity
 */
export const paymentEntitySchema = createPaymentSchema.extend({
  createdAt: z.date(),
  id: z.number().int().positive(),
  invoiceId: z.number().int().positive(),
  updatedAt: z.date(),
  workspaceId: z.number().int().positive(),
});

/**
 * Minimal invoice shape returned with payment list (subset of full invoice entity).
 * Use this for list responses; use full invoice types for get-by-id when needed.
 */
const paymentInvoiceRelationForListSchema = z
  .object({
    balance: z.number(),
    clientEmail: z.string(),
    currency: z.string(),
    invoiceNumber: z.string(),
    sequence: z.number().int().positive(),
    status: z.string(),
    total: z.number(),
  })
  .extend({
    business: businessEntitySchema.pick({
      id: true,
      name: true,
    }),
    client: clientEntitySchema.pick({
      businessName: true,
      id: true,
      name: true,
    }),
  });

export const paymentListSchema = paymentEntitySchema.extend({
  invoice: paymentInvoiceRelationForListSchema,
});

/**
 * Schema for updating a payment
 */
export const updatePaymentSchema = createPaymentSchema.partial();

/**
 * Schema for POST /payments/:id/send-receipt (enqueue send receipt email)
 */
export const sendReceiptBodySchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  message: z.string().trim().min(1, "Message is required"),
  subject: z.string().trim().min(1, "Subject is required"),
});

export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
export type GetPaymentByIdParams = z.infer<typeof getPaymentByIdSchema>;
export type ListPaymentsQuery = z.infer<typeof listPaymentsSchema>;

export type PaymentEntity = z.infer<typeof paymentEntitySchema>;
export type PaymentList = z.infer<typeof paymentListSchema>;
export type SendReceiptBody = z.infer<typeof sendReceiptBodySchema>;

export type UpdatePaymentDto = z.infer<typeof updatePaymentSchema>;
