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
    notes: z.record(z.string(), z.unknown()).nullish(),
    purchaseOrder: z.string().nullish(),
    subtotal: z.number(),
    terms: z.record(z.string(), z.unknown()).nullish(),
    total: z.number(),
    totalPaid: z.number().optional(),
    totalTax: z.number(),
  }),
  items: z.array(
    z.object({
      description: z.record(z.string(), z.unknown()).nullish(),
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
  descriptiveItems: z
    .array(
      z.object({
        description: z.record(z.string(), z.unknown()).nullish(),
        title: z.string(),
      }),
    )
    .optional(),
  invoice: z.object({
    currency: z.string(),
    discount: z.number(),
    documentType: z.literal("estimate"),
    exclusions: z.record(z.string(), z.unknown()).nullish(),
    invoiceNumber: z.string(),
    notes: z.record(z.string(), z.unknown()).nullish(),
    signature: z
      .object({
        fullName: z.string(),
        signatureImageUrl: z.string().optional(),
        signedAt: z.string(),
      })
      .nullish(),
    status: z.string(),
    subtotal: z.number(),
    summary: z.record(z.string(), z.unknown()).nullish(),
    terms: z.record(z.string(), z.unknown()).nullish(),
    timelineEndDate: z.union([z.string(), z.date()]).nullish(),
    timelineStartDate: z.union([z.string(), z.date()]).nullish(),
    total: z.number(),
    totalTax: z.number(),
  }),
  items: z.array(
    z.object({
      description: z.record(z.string(), z.unknown()).nullish(),
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
    workCompleted: z.record(z.string(), z.unknown()).nullish(),
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

export const proposalPdfPayloadSchema = z.object({
  client: z.object({
    address: z.string().nullish(),
    businessName: z.string().nullish(),
    email: z.string().nullish(),
    logo: z.string().nullish(),
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
  descriptiveItems: z
    .array(
      z.object({
        description: z.record(z.string(), z.unknown()).nullish(),
        title: z.string(),
      }),
    )
    .optional(),
  document: z.object({
    currency: z.string(),
    exclusions: z.record(z.string(), z.unknown()).nullish(),
    notes: z.record(z.string(), z.unknown()).nullish(),
    proposalNumber: z.string(),
    signature: z
      .object({
        fullName: z.string(),
        signatureImageUrl: z.string().optional(),
        signedAt: z.string(),
      })
      .nullish(),
    summary: z.record(z.string(), z.unknown()).nullish(),
    terms: z.record(z.string(), z.unknown()).nullish(),
    timelineEndDate: z.union([z.string(), z.date()]).nullish(),
    timelineStartDate: z.union([z.string(), z.date()]).nullish(),
    total: z.number(),
  }),
});

export type ProposalPdfPayload = z.infer<typeof proposalPdfPayloadSchema>;
