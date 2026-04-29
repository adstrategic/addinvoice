import { z } from "zod";

export const invoicePdfPayloadSchema = z.object({
  client: z.object({
    address: z.string().nullish(),
    businessName: z.string().nullish(),
    email: z.string().nullish(),
    name: z.string(),
    nit: z.string().nullish(),
    phone: z.string().nullish(),
  }),
  company: z.object({
    address: z.string().nullish(),
    email: z.string().nullish(),
    logo: z.string().nullish(),
    name: z.string(),
    nit: z.string().nullish(),
    phone: z.string().nullish(),
  }),
  invoice: z.object({
    balance: z.number().optional(),
    currency: z.string(),
    discount: z.number(),
    dueDate: z.union([z.string(), z.date()]),
    invoiceNumber: z.string(),
    issueDate: z.union([z.string(), z.date()]),
    notes: z.string().nullish(),
    purchaseOrder: z.string().nullish(),
    subtotal: z.number(),
    terms: z.string().nullish(),
    total: z.number(),
    totalPaid: z.number().optional(),
    totalTax: z.number(),
  }),
  items: z.array(
    z.object({
      description: z.string().nullish(),
      discountAmount: z.number().optional(),
      name: z.string(),
      quantity: z.number(),
      quantityUnit: z.string(),
      tax: z.number(),
      total: z.number(),
      unitPrice: z.number(),
    }),
  ),
  paymentMethod: z
    .object({
      handle: z.string(),
      type: z.string(),
    })
    .nullish(),
});

export type InvoicePdfPayload = z.infer<typeof invoicePdfPayloadSchema>;

export const receiptPdfPayloadSchema = z.object({
  client: z.object({
    email: z.string().nullish(),
    name: z.string(),
  }),
  company: z.object({
    address: z.string().nullish(),
    logo: z.string().nullish(),
    name: z.string(),
  }),
  invoice: z.object({
    balance: z.number(),
    currency: z.string(),
    invoiceNumber: z.string(),
    status: z.string(),
    total: z.number(),
    totalPaid: z.number(),
  }),
  payment: z.object({
    amount: z.number(),
    date: z.string(),
    id: z.string(),
    method: z.string(),
    notes: z.string().nullish(),
  }),
  payments: z.array(
    z.object({
      amount: z.number(),
      date: z.string(),
      method: z.string(),
    }),
  ),
});

export type ReceiptPdfPayload = z.infer<typeof receiptPdfPayloadSchema>;

/** Body for POST /generate-batch: array of invoice PDF payloads */
export const invoicePdfBatchSchema = z.object({
  payloads: z.array(invoicePdfPayloadSchema),
});

export type InvoicePdfBatchPayload = z.infer<typeof invoicePdfBatchSchema>;

/** Estimate PDF payload (same shape as invoice but documentType: "estimate", no dueDate/issueDate) */
export const estimatePdfPayloadSchema = z.object({
  client: z.object({
    address: z.string().nullish(),
    businessName: z.string().nullish(),
    email: z.string().nullish(),
    name: z.string(),
    nit: z.string().nullish(),
    phone: z.string().nullish(),
  }),
  company: z.object({
    address: z.string().nullish(),
    email: z.string().nullish(),
    logo: z.string().nullish(),
    name: z.string(),
    nit: z.string().nullish(),
    phone: z.string().nullish(),
  }),
  invoice: z.object({
    currency: z.string(),
    discount: z.number(),
    documentType: z.literal("estimate"),
    invoiceNumber: z.string(),
    notes: z.string().nullish(),
    status: z.string(),
    subtotal: z.number(),
    summary: z.string().nullish(),
    terms: z.string().nullish(),
    timelineEndDate: z.union([z.string(), z.date()]).nullish(),
    timelineStartDate: z.union([z.string(), z.date()]).nullish(),
    total: z.number(),
    totalTax: z.number(),
  }),
  items: z.array(
    z.object({
      description: z.string().nullish(),
      discount: z.number(),
      discountAmount: z.number().optional(),
      name: z.string(),
      quantity: z.number(),
      quantityUnit: z.string().nullish(),
      tax: z.number().optional(),
      total: z.number(),
      unitPrice: z.number(),
    }),
  ),
  paymentMethod: z.null(),
});

export type EstimatePdfPayload = z.infer<typeof estimatePdfPayloadSchema>;

export const advancePdfPayloadSchema = z.object({
  advance: z.object({
    advanceDate: z.union([z.string(), z.date()]),
    location: z.string().nullish(),
    projectName: z.string(),
    sequence: z.number(),
    workCompleted: z.string().nullish(),
  }),
  attachments: z.array(
    z.object({
      fileName: z.string().nullish(),
      mimeType: z.string().nullish(),
      url: z.string().url(),
    }),
  ),
  client: z.object({
    email: z.string().nullish(),
    name: z.string(),
    phone: z.string().nullish(),
  }),
  company: z.object({
    address: z.string().nullish(),
    logo: z.string().nullish(),
    name: z.string(),
    phone: z.string().nullish(),
  }),
});

export type AdvancePdfPayload = z.infer<typeof advancePdfPayloadSchema>;
