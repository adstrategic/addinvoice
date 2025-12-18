import { z } from "zod";
import type { TaxMode, DiscountType, QuantityUnit } from "../types/api";

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
  z.string().nullable()
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
  unitPrice: z.coerce.number().min(0, "Unit price must be 0 or greater"),
  discount: z.coerce.number().min(0).default(0),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).default("NONE"),
  tax: z.coerce.number().min(0).max(100).optional(),
  vatEnabled: z.boolean().optional(),
  saveToCatalog: z.boolean().default(false).optional(),
  // Optional taxMode - if provided, will update the invoice's taxMode
  taxMode: z.enum(["NONE", "BY_PRODUCT", "BY_TOTAL"]).optional(),
});

/**
 * Discount and VAT schema
 */
export const discountVATSchema = z
  .object({
    discount: z.coerce.number().min(0).default(0),
    discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).default("NONE"),
    taxMode: z.enum(["NONE", "BY_PRODUCT", "BY_TOTAL"]).default("NONE"),
    taxName: z.string().optional().nullable(),
    taxPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.discountType !== "NONE" && data.discount <= 0) {
        return false;
      }
      return true;
    },
    {
      message:
        "Discount amount must be greater than 0 when discount type is not NONE",
      path: ["discount"],
    }
  )
  .refine(
    (data) => {
      if (data.taxMode === "BY_TOTAL") {
        return (
          data.taxName &&
          data.taxPercentage !== null &&
          data.taxPercentage !== undefined
        );
      }
      return true;
    },
    {
      message: "Tax name and percentage are required when tax mode is BY_TOTAL",
      path: ["taxName"],
    }
  );

/**
 * Payment schema
 */
export const paymentSchema = z.object({
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  paymentMethod: z.string().min(1, "Payment method is required"),
  transactionId: z.string().optional(),
  paidAt: z.string().min(1, "Payment date is required"),
  details: z.string().optional().nullable(),
});

/**
 * Notes and terms schema
 */
export const notesTermsSchema = z.object({
  notes: z.string().optional().nullable(),
  terms: z.string().optional().nullable(),
});

/**
 * Invoice create schema (for initial save - header + client + discounts/VAT + notes/terms)
 */
export const baseInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  issueDate: z.date(),
  dueDate: z.date(),
  purchaseOrder: emptyStringToNull,
  customHeader: emptyStringToNull,
  clientId: z.coerce.number().min(1, "Client is required"),
  businessId: z.coerce.number().int().positive("Business must be selected"),
  discount: z.coerce.number().min(0).default(0),
  discountType: z.enum(["NONE", "PERCENTAGE", "FIXED"]).default("NONE"),
  taxMode: z.enum(["NONE", "BY_PRODUCT", "BY_TOTAL"]).default("NONE"),
  taxName: emptyStringToNull,
  taxPercentage: z.coerce.number().min(0).max(100).optional().nullable(),
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
    }
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
    }
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
    }
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
export type InvoiceHeaderInput = z.infer<typeof invoiceHeaderSchema>;
export type ClientInput = z.infer<typeof clientSchema>;
export type InvoiceItemInput = z.infer<typeof invoiceItemSchema>;
export type DiscountVATInput = z.infer<typeof discountVATSchema>;
export type PaymentInput = z.infer<typeof paymentSchema>;
export type NotesTermsInput = z.infer<typeof notesTermsSchema>;
export type CreateInvoiceDTO = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceDTO = z.infer<typeof updateInvoiceSchema>;
export type InvoiceItemCreateInput = z.infer<typeof invoiceItemCreateSchema>;
export type InvoiceItemUpdateInput = z.infer<typeof invoiceItemUpdateSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
export type PaymentUpdateInput = z.infer<typeof paymentUpdateSchema>;
