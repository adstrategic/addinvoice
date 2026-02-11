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
      total: z.number(),
    })
  ),
});

export type InvoicePdfPayload = z.infer<typeof invoicePdfPayloadSchema>;
