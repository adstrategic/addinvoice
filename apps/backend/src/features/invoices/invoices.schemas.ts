import { InvoiceStatus } from "@addinvoice/db";
import { z } from "zod";

import { businessEntitySchema } from "../businesses/businesses.schemas.js";
import {
  clientEntitySchema,
  createClientSchema,
} from "../clients/clients.schemas.js";
import { paymentEntitySchema } from "../payments/payments.schemas.js";

// ===== ENUMS =====

export const InvoiceStatusEnum = z.nativeEnum(InvoiceStatus);

export const TaxModeEnum = z.enum(["BY_PRODUCT", "BY_TOTAL", "NONE"]);

export const QuantityUnitEnum = z.enum(["DAYS", "HOURS", "UNITS"]);

export const DiscountTypeEnum = z.enum(["PERCENTAGE", "FIXED", "NONE"]);

// ===== VALIDATION SCHEMAS (for middleware) =====

/**
 * Schema for listing invoices.
 * status: optional string, can be a single value or comma-separated (e.g. SENT,VIEWED).
 */
export const listInvoicesSchema = z.object({
  businessId: z.coerce.number().int().positive().optional(),
  clientId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
  status: InvoiceStatusEnum.optional(),
});

/**
 * Schema for getting invoice by Sequence
 */
export const getInvoiceBySequenceSchema = z.object({
  sequence: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

/**
 * Schema for GET /invoices/next-number query (businessId required)
 */
export const getNextInvoiceNumberQuerySchema = z.object({
  businessId: z.coerce.number().int().positive("businessId is required"),
});

/**
 * Body for POST /invoices/from-voice-transcript
 */
export const fromVoiceTranscriptBodySchema = z.object({
  businessId: z.coerce.number().int().positive("Business is required"),
  clientId: z.coerce.number().int().positive("Client is required"),
  transcript: z
    .string()
    .trim()
    .min(8, "Transcript is too short")
    .max(16_000, "Transcript is too long"),
});

/**
 * Body for POST /invoices/from-voice-audio (multipart/form-data).
 * Audio file is handled by multer; only text fields are validated here.
 */
export const fromVoiceAudioBodySchema = z.object({
  businessId: z.coerce.number().int().positive("Business is required"),
  clientId: z.coerce.number().int().positive("Client is required"),
});

/**
 * Schema for getting invoice by ID
 */
export const getInvoiceByIdSchema = z.object({
  invoiceId: z.coerce
    .number()
    .int()
    .positive("The ID must be a positive number"),
});

/**
 * Schema for POST /invoices/:sequence/send (enqueue send invoice)
 */
export const sendInvoiceBodySchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  message: z.string().trim().min(1, "Message is required"),
  subject: z.string().trim().min(1, "Subject is required"),
});

/**
 * Schema for invoice item (nested in create/update invoice)
 */
export const invoiceItemSchema = z.object({
  catalogId: z.coerce.number().int().positive().optional().nullable(), // Optional: link to existing catalog
  description: z
    .string()
    .trim()
    .min(1, "Item description is required")
    .max(1000, "Item description is too long"),
  discount: z.coerce
    .number()
    .nonnegative("Discount must be greater than or equal to 0")
    .default(0),
  discountType: DiscountTypeEnum.default("NONE"),
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(255, "Item name is too long"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  quantityUnit: QuantityUnitEnum.default("UNITS"),
  saveToCatalog: z.boolean().default(false).optional(),
  tax: z.coerce
    .number()
    .min(0, "Tax must be between 0 and 100")
    .max(100, "Tax must be between 0 and 100")
    .default(0)
    .optional(),
  unitPrice: z.coerce.number().positive("Unit price must be greater than 0"),
  vatEnabled: z.boolean().default(false).optional(),
});

/**
 * Base schema for invoice (before refinements)
 */
const baseInvoiceSchema = z.object({
  // Header fields
  businessId: z.coerce.number().int().positive("Business must be selected"),
  clientAddress: z.string().trim().max(200).nullish(),
  clientData: createClientSchema.optional(),
  // Invoice-specific client contact fields (can differ from client defaults)
  clientEmail: z.string().trim().email("Invalid email address").optional(),
  // Client selection: either clientId or createClient with clientData
  clientId: z.coerce.number().int(),
  clientPhone: z.string().trim().max(50).nullish(),
  // .positive("Client ID must be a positive number")
  // .optional(),
  createClient: z.boolean(),
  // General settings
  currency: z.string().trim().min(1).max(10).default("USD"),
  customHeader: z.string().trim().max(1000).nullish(),
  discount: z.coerce
    .number()
    .nonnegative("Discount must be greater than or equal to 0")
    .default(0),
  discountType: DiscountTypeEnum.default("NONE"),
  dueDate: z.coerce.date({ required_error: "Due date is required" }),
  invoiceNumber: z
    .string()
    .trim()
    .min(1, "Invoice number is required")
    .max(50, "Invoice number is too long"),
  issueDate: z.coerce.date({ required_error: "Issue date is required" }),
  // Items
  items: z.array(invoiceItemSchema).optional(),
  notes: z.string().trim().max(2000).nullish(),
  purchaseOrder: z.string().trim().max(100).nullish(),
  selectedPaymentMethodId: z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  taxMode: z.enum(["NONE", "BY_PRODUCT", "BY_TOTAL"]).default("NONE"),
  taxName: z.string().trim().max(100).nullish(),
  taxPercentage: z.coerce
    .number()
    .min(0, "Tax percentage must be between 0 and 100")
    .max(100, "Tax percentage must be between 0 and 100")
    .nullish(),
  terms: z.string().trim().max(2000).nullish(),
});

/**
 * Schema for creating an invoice
 */
export const createInvoiceSchema = baseInvoiceSchema
  .refine(
    (data) => {
      // If createClient is true, clientData must be provided
      if (data.createClient) {
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
      if (!data.createClient) {
        return data.clientId > 0;
      }
      return true;
    },
    {
      message: "Client must be selected",
      path: ["clientId"],
    },
  )
  .refine(
    (data) => {
      // If not creating a new client, clientEmail is required
      if (!data.createClient) {
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
        return data.taxName == null && data.taxPercentage == null;
      }
      return true;
    },
    {
      message:
        "Tax name and tax percentage should not be set when tax mode is not BY_TOTAL",
      path: ["taxMode"],
    },
  );

/**
 * Schema for updating an invoice
 */
export const updateInvoiceSchema = baseInvoiceSchema.partial().extend({
  items: z.array(invoiceItemSchema).optional(),
});

/**
 * Schema for creating an invoice item (standalone)
 */
export const createInvoiceItemSchema = z.object({
  catalogId: z.coerce.number().int().positive().optional().nullable(), // Optional: link to existing catalog
  description: z
    .string()
    .trim()
    .min(1, "Item description is required")
    .max(1000, "Item description is too long"),
  discount: z.coerce
    .number()
    .nonnegative("Discount must be greater than or equal to 0")
    .default(0)
    .or(z.string().transform((val) => parseFloat(val))),
  discountType: DiscountTypeEnum.default("NONE"),
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(255, "Item name is too long"),
  quantity: z.coerce
    .number()
    .positive("Quantity must be greater than 0")
    .or(z.string().transform((val) => parseFloat(val))),
  quantityUnit: QuantityUnitEnum.default("UNITS"),
  saveToCatalog: z.boolean().default(false).optional(),
  tax: z.coerce
    .number()
    .min(0, "Tax must be between 0 and 100")
    .max(100, "Tax must be between 0 and 100")
    .default(0)
    .optional()
    .or(z.string().transform((val) => parseFloat(val))),
  // Optional taxMode - if provided, will update the invoice's taxMode
  taxMode: TaxModeEnum.optional(),
  // Optional taxName and taxPercentage - if provided, will update the invoice's tax info
  taxName: z.string().trim().max(100).nullish(),
  taxPercentage: z.coerce
    .number()
    .min(0, "Tax percentage must be between 0 and 100")
    .max(100, "Tax percentage must be between 0 and 100")
    .nullish(),
  unitPrice: z.coerce
    .number()
    .nonnegative("Unit price must be greater than or equal to 0")
    .or(z.string().transform((val) => parseFloat(val))),
  vatEnabled: z.boolean().default(false).optional(),
});

export const invoiceItemEntitySchema = invoiceItemSchema.extend({
  createdAt: z.date(),
  id: z.number().int().positive(),
  invoiceId: z.number().int().positive(),
  total: z.number(),
  updatedAt: z.date(),
});

/**
 * Schema for updating an invoice item
 */
export const updateInvoiceItemSchema = createInvoiceItemSchema.partial();

/**
 * Schema for getting invoice item by ID
 */
export const getInvoiceItemByIdSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  itemId: z.coerce
    .number()
    .int()
    .positive("The item ID must be a positive number"),
});

/**
 * Schema for getting payment by ID (invoiceId + paymentId in path)
 */
export const getPaymentByIdSchema = getInvoiceByIdSchema.extend({
  paymentId: z.coerce
    .number()
    .int()
    .positive("The payment ID must be a positive number"),
});

export const invoiceEntitySchema = baseInvoiceSchema
  .extend({
    balance: z.number(),
    createdAt: z.date(),
    id: z.number().int().positive(),
    lastReminderSentAt: z.date().nullable(),
    paidAt: z.date().nullable(),
    paymentLink: z.string().nullable(),
    paymentProvider: z.string().nullable(),
    selectedPaymentMethodId: z.number().int().nullable(),
    sentAt: z.date().nullable(),
    sequence: z.number().int().positive(),
    status: z.enum(["DRAFT", "SENT", "VIEWED", "PAID", "OVERDUE"]),
    subtotal: z.number(),

    total: z.number(),
    totalTax: z.number(),
    updatedAt: z.date(),
    viewedAt: z.date().nullable(),
    workspaceId: z.number().int().positive(),
  })
  .omit({
    clientData: true,
    createClient: true,
  });

/**
 * Minimal schema for invoice's selected payment method relation
 */
export const invoiceSelectedPaymentMethodSchema = z.object({
  handle: z.string().nullable(),
  id: z.number().int().positive(),
  isEnabled: z.boolean(),
  type: z.enum(["PAYPAL", "VENMO", "ZELLE", "STRIPE"]),
});

export const invoiceEntityWithRelationsSchema = invoiceEntitySchema.extend({
  business: businessEntitySchema,
  client: clientEntitySchema,
  items: z.array(invoiceItemEntitySchema).optional(),
  payments: z.array(paymentEntitySchema).optional(),
  selectedPaymentMethod: invoiceSelectedPaymentMethodSchema
    .nullable()
    .optional(),
});

/**
 * Schema for payment detail (get by ID) with full invoice, client, and business.
 * Omits invoice.payments to avoid circular schema.
 */
export const paymentDetailSchema = paymentEntitySchema.extend({
  invoice: invoiceEntityWithRelationsSchema,
});

// ===== DTOs (for the service) =====

export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export type CreateInvoiceItemDto = z.infer<typeof createInvoiceItemSchema>;
export type GetInvoiceByIdParams = z.infer<typeof getInvoiceByIdSchema>;
export type GetInvoiceBySequenceParams = z.infer<
  typeof getInvoiceBySequenceSchema
>;
export type GetInvoiceItemByIdParams = z.infer<typeof getInvoiceItemByIdSchema>;
export type InvoiceEntity = z.infer<typeof invoiceEntitySchema>;
export type InvoiceEntityWithRelations = z.infer<
  typeof invoiceEntityWithRelationsSchema
>;
export type InvoiceItemDto = z.infer<typeof invoiceItemSchema>;
export type InvoiceItemEntity = z.infer<typeof invoiceItemEntitySchema>;
export type ListInvoicesQuery = z.infer<typeof listInvoicesSchema>;
// Payment related types
export type PaymentDetail = z.infer<typeof paymentDetailSchema>;
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;

export type UpdateInvoiceItemDto = z.infer<typeof updateInvoiceItemSchema>;
