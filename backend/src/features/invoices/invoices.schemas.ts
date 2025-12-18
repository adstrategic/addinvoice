import { z } from "zod";

// ===== ENUMS =====

export const InvoiceStatusEnum = z.enum([
  "DRAFT",
  "SENT",
  "VIEWED",
  "PAID",
  "OVERDUE",
]);

export const TaxModeEnum = z.enum(["BY_PRODUCT", "BY_TOTAL", "NONE"]);

export const QuantityUnitEnum = z.enum(["DAYS", "HOURS", "UNITS"]);

export const DiscountTypeEnum = z.enum(["PERCENTAGE", "FIXED", "NONE"]);

// ===== VALIDATION SCHEMAS (for middleware) =====

/**
 * Schema for listing invoices
 */
export const listInvoicesSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  search: z.string().optional(),
  status: InvoiceStatusEnum.optional(),
  clientId: z.coerce.number().int().positive().optional(),
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
 * Schema for getting invoice by ID
 */
export const getInvoiceByIdSchema = z.object({
  invoiceId: z.coerce
    .number()
    .int()
    .positive("The ID must be a positive number"),
});

/**
 * Schema for invoice item (nested in create/update invoice)
 */
export const invoiceItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(255, "Item name is too long"),
  description: z
    .string()
    .trim()
    .min(1, "Item description is required")
    .max(1000, "Item description is too long"),
  quantity: z.coerce.number().positive("Quantity must be greater than 0"),
  quantityUnit: QuantityUnitEnum.default("UNITS"),
  unitPrice: z.coerce
    .number()
    .nonnegative("Unit price must be greater than or equal to 0"),
  discount: z.coerce
    .number()
    .nonnegative("Discount must be greater than or equal to 0")
    .default(0),
  discountType: DiscountTypeEnum.default("NONE"),
  tax: z.coerce
    .number()
    .min(0, "Tax must be between 0 and 100")
    .max(100, "Tax must be between 0 and 100")
    .default(0)
    .optional(),
  vatEnabled: z.boolean().default(false).optional(),
  saveToCatalog: z.boolean().default(false).optional(),
});

/**
 * Base schema for invoice (before refinements)
 */
const baseInvoiceSchema = z.object({
  // Header fields
  businessId: z.coerce.number().int().positive("Business must be selected"),
  invoiceNumber: z
    .string()
    .trim()
    .min(1, "Invoice number is required")
    .max(50, "Invoice number is too long"),
  issueDate: z.coerce.date({ required_error: "Issue date is required" }),
  dueDate: z.coerce.date({ required_error: "Due date is required" }),
  purchaseOrder: z.string().trim().max(100).nullish(),
  customHeader: z.string().trim().max(1000).nullish(),
  clientId: z.coerce
    .number()
    .int()
    .positive("Client ID must be a positive number"),
  // General settings
  currency: z.string().trim().min(1).max(10).default("USD"),
  discount: z.coerce
    .number()
    .nonnegative("Discount must be greater than or equal to 0")
    .default(0),
  discountType: DiscountTypeEnum.default("NONE"),
  taxMode: z.enum(["NONE", "BY_PRODUCT", "BY_TOTAL"]).default("NONE"),
  taxName: z.string().trim().max(100).nullish(),
  taxPercentage: z.coerce
    .number()
    .min(0, "Tax percentage must be between 0 and 100")
    .max(100, "Tax percentage must be between 0 and 100")
    .nullish(),
  notes: z.string().trim().max(2000).nullish(),
  terms: z.string().trim().max(2000).nullish(),
  // Items
  items: z.array(invoiceItemSchema).optional(),
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
 * Schema for updating an invoice
 */
export const updateInvoiceSchema = baseInvoiceSchema.partial().extend({
  items: z.array(invoiceItemSchema).optional(),
});

/**
 * Schema for creating an invoice item (standalone)
 */
export const createInvoiceItemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(255, "Item name is too long"),
  description: z
    .string()
    .trim()
    .min(1, "Item description is required")
    .max(1000, "Item description is too long"),
  quantity: z.coerce
    .number()
    .positive("Quantity must be greater than 0")
    .or(z.string().transform((val) => parseFloat(val))),
  quantityUnit: QuantityUnitEnum.default("UNITS"),
  unitPrice: z.coerce
    .number()
    .nonnegative("Unit price must be greater than or equal to 0")
    .or(z.string().transform((val) => parseFloat(val))),
  discount: z.coerce
    .number()
    .nonnegative("Discount must be greater than or equal to 0")
    .default(0)
    .or(z.string().transform((val) => parseFloat(val))),
  discountType: DiscountTypeEnum.default("NONE"),
  tax: z.coerce
    .number()
    .min(0, "Tax must be between 0 and 100")
    .max(100, "Tax must be between 0 and 100")
    .default(0)
    .optional()
    .or(z.string().transform((val) => parseFloat(val))),
  vatEnabled: z.boolean().default(false).optional(),
  saveToCatalog: z.boolean().default(false).optional(),
  // Optional taxMode - if provided, will update the invoice's taxMode
  taxMode: TaxModeEnum.optional(),
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
 * Schema for creating a payment
 */
export const createPaymentSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  amount: z.coerce
    .number()
    .positive("Payment amount must be greater than 0")
    .or(z.string().transform((val) => parseFloat(val))),
  paymentMethod: z
    .string()
    .trim()
    .min(1, "Payment method is required")
    .max(50, "Payment method is too long"),
  transactionId: z
    .string()
    .trim()
    .min(1, "Transaction ID is required")
    .max(255, "Transaction ID is too long"),
  details: z.string().trim().max(1000).nullish(),
  paidAt: z.coerce.date().optional(),
});

/**
 * Schema for updating a payment
 */
export const updatePaymentSchema = createPaymentSchema
  .omit({ invoiceId: true })
  .partial();

/**
 * Schema for getting payment by ID
 */
export const getPaymentByIdSchema = z.object({
  invoiceId: z.coerce.number().int().positive(),
  paymentId: z.coerce
    .number()
    .int()
    .positive("The payment ID must be a positive number"),
});

// ===== DTOs (for the service) =====

export type ListInvoicesQuery = z.infer<typeof listInvoicesSchema>;
export type GetInvoiceBySequenceParams = z.infer<
  typeof getInvoiceBySequenceSchema
>;
export type GetInvoiceByIdParams = z.infer<typeof getInvoiceByIdSchema>;
export type CreateInvoiceDto = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceDto = z.infer<typeof updateInvoiceSchema>;
export type InvoiceItemDto = z.infer<typeof invoiceItemSchema>;
export type CreateInvoiceItemDto = z.infer<typeof createInvoiceItemSchema>;
export type UpdateInvoiceItemDto = z.infer<typeof updateInvoiceItemSchema>;
export type GetInvoiceItemByIdParams = z.infer<typeof getInvoiceItemByIdSchema>;
export type CreatePaymentDto = z.infer<typeof createPaymentSchema>;
export type UpdatePaymentDto = z.infer<typeof updatePaymentSchema>;
export type GetPaymentByIdParams = z.infer<typeof getPaymentByIdSchema>;

// ===== ENTITY SCHEMAS (domain models) =====

export type InvoiceEntity = {
  id: number;
  sequence: number;
  workspaceId: number;
  clientId: number;
  invoiceNumber: string;
  status: z.infer<typeof InvoiceStatusEnum>;
  issueDate: Date;
  dueDate: Date;
  purchaseOrder: string | null;
  customHeader: string | null;
  currency: string;
  subtotal: number;
  totalTax: number;
  discount: number;
  discountType: string | null;
  taxMode: z.infer<typeof TaxModeEnum>;
  taxName: string | null;
  taxPercentage: number | null;
  total: number;
  notes: string | null;
  terms: string | null;
  paymentLink: string | null;
  paymentProvider: string | null;
  sentAt: Date | null;
  viewedAt: Date | null;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export type InvoiceItemEntity = {
  id: number;
  invoiceId: number;
  name: string;
  description: string;
  quantity: number;
  quantityUnit: z.infer<typeof QuantityUnitEnum>;
  unitPrice: number;
  discount: number;
  discountType: z.infer<typeof DiscountTypeEnum>;
  tax: number;
  vatEnabled: boolean;
  total: number;
  catalogId: number | null;
  createdAt: Date;
  updatedAt: Date;
};

export type PaymentEntity = {
  id: number;
  workspaceId: number;
  invoiceId: number;
  amount: number;
  paymentMethod: string;
  transactionId: string;
  details: string | null;
  paidAt: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};
