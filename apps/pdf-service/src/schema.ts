import { z } from "zod";

export const invoicePdfPayloadSchema = z.object({
  invoice: z.object({
    invoiceNumber: z.string(),
    issueDate: z.union([z.string(), z.date()]),
    dueDate: z.union([z.string(), z.date()]),
    purchaseOrder: z.string().nullish(),
    currency: z.string(),
    subtotal: z.number(),
    discount: z.number(),
    totalTax: z.number(),
    total: z.number(),
    totalPaid: z.number().optional(),
    balance: z.number().optional(),
    notes: z.string().nullish(),
    terms: z.string().nullish(),
  }),
  client: z.object({
    name: z.string(),
    businessName: z.string().nullish(),
    address: z.string().nullish(),
    phone: z.string().nullish(),
    email: z.string().nullish(),
    nit: z.string().nullish(),
  }),
  company: z.object({
    name: z.string(),
    address: z.string().nullish(),
    email: z.string().nullish(),
    phone: z.string().nullish(),
    nit: z.string().nullish(),
    logo: z.string().nullish(),
  }),
  items: z.array(
    z.object({
      name: z.string(),
      description: z.string().nullish(),
      quantity: z.number(),
      quantityUnit: z.string(),
      unitPrice: z.number(),
      tax: z.number(),
      discountAmount: z.number().optional(),
      total: z.number(),
    }),
  ),
  paymentMethod: z
    .object({
      type: z.string(),
      handle: z.string(),
    })
    .nullish(),
});

export type InvoicePdfPayload = z.infer<typeof invoicePdfPayloadSchema>;

export const receiptPdfPayloadSchema = z.object({
  company: z.object({
    name: z.string(),
    logo: z.string().nullish(),
    address: z.string().nullish(),
  }),
  client: z.object({
    name: z.string(),
    email: z.string().nullish(),
  }),
  invoice: z.object({
    invoiceNumber: z.string(),
    total: z.number(),
    currency: z.string(),
    status: z.string(),
    totalPaid: z.number(),
    balance: z.number(),
  }),
  payment: z.object({
    id: z.string(),
    amount: z.number(),
    method: z.string(),
    date: z.string(),
    notes: z.string().nullish(),
  }),
  payments: z.array(
    z.object({
      date: z.string(),
      method: z.string(),
      amount: z.number(),
    }),
  ),
});

export type ReceiptPdfPayload = z.infer<typeof receiptPdfPayloadSchema>;

/** Body for POST /generate-batch: array of invoice PDF payloads */
export const invoicePdfBatchSchema = z.object({
  payloads: z.array(invoicePdfPayloadSchema),
});

export type InvoicePdfBatchPayload = z.infer<typeof invoicePdfBatchSchema>;
