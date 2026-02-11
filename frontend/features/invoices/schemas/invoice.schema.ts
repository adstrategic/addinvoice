import { z } from "zod";
import { paginationMetaSchema } from "@/lib/api/types";
import { businessResponseSchema } from "@/features/businesses";
import { clientResponseSchema, createClientSchema } from "@/features/clients";
import { nullableOptional } from "@/lib/utils";

/**
 * Zod schemas for invoice form validation
 * These match the backend DTOs and API structure
 */

/**
 * Helper schema for optional string fields that should be null when empty
 * Transforms empty strings to null at parse/validation time
 */
const emptyStringToNull = z.preprocess(
  (val) => (val === "" || val === undefined ? null : val),
  z.string().nullable(),
);

/**
 * Invoice header schema
 */
export const invoiceHeaderSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  purchaseOrder: z.string().optional().nullable(),
  customHeader: z.string().optional().nullable(),
});

/**
 * Client schema - just needs clientId for invoice creation
 */
export const clientSchema = z.object({
  clientId: z.number().min(1, "Client is required"),
});

/**
 * Invoice item schema
 */
export const invoiceItemSchema = z.object({
  name: z.string().min(1, "Product name is required"),
  description: z.string().min(1, "Description is required"),
  quantity: z.coerce.number().min(0.01, "Quantity must be greater than 0"),
  quantityUnit: z.enum(["DAYS", "HOURS", "UNITS"]),
  unitPrice: z.coerce.number().positive("Unit price must be greater than 0"),
  discount: z.coerce.number().min(0).default(0),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).default("NONE"),
  tax: z.coerce.number().min(0).max(100).optional(),
  vatEnabled: z.boolean().optional(),
  saveToCatalog: z.boolean().default(false).optional(),
  catalogId: z.coerce.number().int().positive().optional().nullable(), // Optional: link to existing catalog
  // Optional taxMode - if provided, will update the invoice's taxMode
  taxMode: z.enum(["NONE", "BY_PRODUCT", "BY_TOTAL"]).optional(),
  // Optional taxName and taxPercentage - if provided, will update the invoice's tax info
  taxName: z.string().optional().nullable(),
  taxPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
});

/**
 * Discount and VAT schema
 */
// export const discountVATSchema = z
//   .object({
//     discount: z.coerce.number().min(0).default(0),
//     discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).default("NONE"),
//     taxMode: z.enum(["NONE", "BY_PRODUCT", "BY_TOTAL"]).default("NONE"),
//     taxName: z.string().optional().nullable(),
//     taxPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
//   })
//   .refine(
//     (data) => {
//       if (data.discountType !== "NONE" && data.discount <= 0) {
//         return false;
//       }
//       return true;
//     },
//     {
//       message:
//         "Discount amount must be greater than 0 when discount type is not NONE",
//       path: ["discount"],
//     }
//   )
//   .refine(
//     (data) => {
//       if (data.taxMode === "BY_TOTAL") {
//         return (
//           data.taxName &&
//           data.taxPercentage !== null &&
//           data.taxPercentage !== undefined
//         );
//       }
//       return true;
//     },
//     {
//       message: "Tax name and percentage are required when tax mode is BY_TOTAL",
//       path: ["taxName"],
//     }
//   );

/**
 * Payment schema
 */
export const paymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: nullableOptional(
    z.string().trim().max(255, "Transaction ID is too long"),
  ),
  paidAt: z.coerce.date(),
  details: z.string().optional().nullable(),
});

//   name: z
//     .string()
//     .trim()
//     .min(1, "Client name is required")
//     .max(255, "Client name is too long"),
//   email: z.string().trim().email("Invalid email address"),
//   phone: nullableOptional(
//     z
//       .string()
//       .trim()
//       .regex(
//         /^\+[1-9]\d{1,14}$/,
//         "The phone must have a valid international format (e.g. +573011234567)"
//       )
//   ),
//   address: nullableOptional(
//     z.string().trim().max(100, "Address cannot exceed 100 characters")
//   ),
//   nit: nullableOptional(
//     z.string().trim().max(15, "NIT/Cedula cannot exceed 15 characters")
//   ),
//   businessName: nullableOptional(
//     z.string().trim().max(100, "Business name cannot exceed 100 characters")
//   ),
// });

/**
 * Invoice create schema (for initial save - header + client + discounts/VAT + notes/terms)
 */
export const baseInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.coerce.date(),
  dueDate: z.coerce.date(),
  purchaseOrder: emptyStringToNull,
  customHeader: emptyStringToNull,
  // Client selection: either clientId or createClient with clientData
  // clientId: z.coerce.number().min(1, "Client is required").optional(),
  clientId: z.coerce.number().int(),
  createClient: z.boolean(),
  clientData: createClientSchema.optional(),
  businessId: z.coerce.number().int().positive("Business must be selected"),
  // Invoice-specific client contact fields (can differ from client defaults)
  // Optional when creating new client (will use clientData fields instead)
  clientEmail: z.string().email("Invalid email address").optional(),
  clientPhone: nullableOptional(
    z
      .string()
      .trim()
      .regex(
        /^\+[1-9]\d{1,14}$/,
        "The phone must have a valid international format (e.g. +573011234567)",
      )
      .optional(),
  ),
  clientAddress: nullableOptional(
    z
      .string()
      .trim()
      .max(100, "Address cannot exceed 100 characters")
      .optional(),
  ),
  discount: z.coerce.number().min(0).default(0),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).default("NONE"),
  taxMode: z.enum(["NONE", "BY_PRODUCT", "BY_TOTAL"]).default("NONE"),
  taxName: emptyStringToNull,
  taxPercentage: z.coerce.number().min(0).max(100).nullable(),
  notes: emptyStringToNull,
  terms: emptyStringToNull,
  currency: z.string().default("USD"),
});

/**
 * Schema for creating an invoice
 */
export const createInvoiceSchema = baseInvoiceSchema
  .refine(
    (data) => {
      // If createClient is true, clientData must be provided
      if (data.createClient === true) {
        return data.clientData != null;
      }
      return true;
    },
    {
      message: "Client data is required when createClient is true",
      path: ["clientData"],
    },
  )
  .refine(
    (data) => {
      // If createClient is false or undefined, clientId must be provided
      if (data.createClient !== true) {
        return data.clientId != null && data.clientId > 0;
      }
      return true;
    },
    {
      message: "Client ID is required when not creating a new client",
      path: ["clientId"],
    },
  )
  .refine(
    (data) => {
      // If not creating a new client, clientEmail is required
      if (data.createClient !== true) {
        return data.clientEmail != null && data.clientEmail.length > 0;
      }
      return true;
    },
    {
      message: "Client email is required when selecting an existing client",
      path: ["clientEmail"],
    },
  )
  .refine(
    (data) => {
      // If taxMode is BY_TOTAL, taxName and taxPercentage are required
      if (data.taxMode === "BY_TOTAL") {
        return (
          data.taxName != null &&
          data.taxName.trim().length > 0 &&
          data.taxPercentage != null &&
          data.taxPercentage > 0
        );
      }
      return true;
    },
    {
      message:
        "Tax name and tax percentage are required when tax mode is BY_TOTAL",
      path: ["taxName", "taxPercentage"],
    },
  )
  .refine(
    (data) => {
      // If discountType is not "none", discount must be > 0
      if (data.discountType !== "NONE") {
        return data.discount > 0;
      }
      return true;
    },
    {
      message: "Discount must be greater than 0 when discount type is set",
      path: ["discount"],
    },
  )
  .refine(
    (data) => {
      // If taxMode is not BY_TOTAL, taxName and taxPercentage should be null/undefined
      if (data.taxMode !== "BY_TOTAL") {
        return data.taxName === null && data.taxPercentage === null;
      }
      return true;
    },
    {
      message:
        "Tax name and tax percentage should not be set when tax mode is not BY_TOTAL",
      path: ["taxMode"],
    },
  )
  .refine(
    (data) => {
      if (!data.issueDate || !data.dueDate) return true;
      return data.issueDate <= data.dueDate;
    },
    {
      message: "Issue date cannot be after the due date",
      path: ["issueDate"],
    },
  )
  .refine(
    (data) => {
      if (!data.issueDate || !data.dueDate) return true;
      return data.dueDate >= data.issueDate;
    },
    {
      message: "Due date cannot be before the issue date",
      path: ["dueDate"],
    },
  );
/**
 * Invoice update schema (for updating after creation)
 */
export const updateInvoiceSchema = baseInvoiceSchema.partial();

/**
 * Invoice item create schema
 */
export const invoiceItemCreateSchema = invoiceItemSchema;

/**
 * Invoice item update schema
 */
export const invoiceItemUpdateSchema = invoiceItemSchema.partial();

/**
 * Payment create schema
 */
export const paymentCreateSchema = paymentSchema;

/**
 * Payment update schema
 */
export const paymentUpdateSchema = paymentSchema.partial();

/**
 * TypeScript types inferred from schemas
 */
/**
 * Invoice item response schema from API
 * Matches InvoiceItemEntity from backend
 */
export const invoiceItemResponseSchema = z.object({
  id: z.number().int().positive(),
  invoiceId: z.number().int().positive(),
  name: z.string(),
  description: z.string(),
  quantity: z.number(),
  quantityUnit: z.enum(["DAYS", "HOURS", "UNITS"]),
  unitPrice: z.number(),
  discount: z.number(),
  discountType: z.enum(["PERCENTAGE", "FIXED", "NONE"]),
  tax: z.number(),
  vatEnabled: z.boolean(),
  total: z.number(),
  catalogId: z.number().int().positive().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

/**
 * Payment response schema from API
 * Matches PaymentEntity from backend
 */
export const paymentResponseSchema = z.object({
  id: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  invoiceId: z.number().int().positive(),
  amount: z.number(),
  paymentMethod: z.string(),
  transactionId: z.string().nullable(),
  details: z.string().nullable(),
  paidAt: z.coerce.date(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  deletedAt: z.coerce.date().nullable(),
});

/**
 * Invoice response schema from API
 * Matches InvoiceEntity from backend
 * Includes relations: business, client, items?, payments?
 */
export const invoiceResponseSchema = baseInvoiceSchema
  .extend({
    id: z.number().int().positive(),
    subtotal: z.number(),
    totalTax: z.number(),
    total: z.number(),
    workspaceId: z.number().int().positive(),
    status: z.enum(["DRAFT", "SENT", "VIEWED", "PAID", "OVERDUE"]),
    sequence: z.number().int().positive(),
    paymentLink: z.string().nullable(),
    paymentProvider: z.string().nullable(),
    balance: z.number(),
    clientEmail: z.string().email("Invalid email address"),

    sentAt: z.coerce.date().nullable(),
    viewedAt: z.coerce.date().nullable(),
    paidAt: z.coerce.date().nullable(),
    createdAt: z.coerce.date(),
    updatedAt: z.coerce.date(),
    deletedAt: z.coerce.date().nullable(),

    business: businessResponseSchema,
    client: clientResponseSchema,
    items: z.array(invoiceItemResponseSchema).optional(),
    payments: z.array(paymentResponseSchema).optional(),
  })
  .omit({
    createClient: true,
    clientData: true,
  });

/**
 * Invoice list response schema with pagination
 */
export const invoiceResponseListSchema = z.object({
  data: z.array(invoiceResponseSchema),
  pagination: paginationMetaSchema,
});

// DTO types
export type InvoiceHeaderInput = z.infer<typeof invoiceHeaderSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type CreateInvoiceDTO = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceDTO = z.infer<typeof updateInvoiceSchema>;
export type InvoiceItemCreateInput = z.infer<typeof invoiceItemCreateSchema>;
export type InvoiceItemUpdateInput = z.infer<typeof invoiceItemUpdateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;

// Response types
export type InvoiceItemResponse = z.infer<typeof invoiceItemResponseSchema>;
export type PaymentResponse = z.infer<typeof paymentResponseSchema>;
export type InvoiceResponse = z.infer<typeof invoiceResponseSchema>;
export type InvoiceResponseList = z.infer<typeof invoiceResponseListSchema>;
