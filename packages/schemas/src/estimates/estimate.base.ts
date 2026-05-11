import z from "zod";
import {
  EstimateStatus,
  DiscountType,
  QuantityUnit,
  TaxMode,
} from "../enums.js";
import { nullableOptional } from "../shared/nullable.js";

// ===== ENUMS =====
export const EstimateStatusEnum = z.nativeEnum(EstimateStatus);
export const TaxModeEnum = z.nativeEnum(TaxMode);
export const QuantityUnitEnum = z.nativeEnum(QuantityUnit);
export const DiscountTypeEnum = z.nativeEnum(DiscountType);

/**
 * Schema for estimate item (nested in create/update estimate). * Base layer - no id, estimateId, or timestamps.
 *
 */
export const baseEstimateItemSchema = z.object({
  catalogId: z.coerce.number().int().positive().optional().nullable(),
  description: z.record(z.string(), z.unknown()),
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

export const baseEstimateDescriptiveItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Descriptive item title is required")
    .max(255, "Descriptive item title is too long"),
  description: z.record(z.string(), z.unknown()),
});

/** * Base schema for estimate (before refinements). * No id, sequence, workspaceId, or relation objects. */
export const baseEstimateSchema = z.object({
  businessId: z.coerce.number().int().positive("Business must be selected"),
  clientAddress: z.string().trim().max(200).nullish(),
  clientEmail: z.string().trim().email("Invalid email address").optional(),
  clientPhone: z.string().trim().max(50).nullish(),
  clientId: z.coerce.number().int("Client must be selected"),
  currency: z.string().trim().min(1).max(10).default("USD"),
  summary: z.record(z.string(), z.unknown()).nullish(),
  timelineStartDate: z.coerce.date().nullish(),
  timelineEndDate: z.coerce.date().nullish(),
  discount: z.coerce
    .number()
    .nonnegative("Discount must be greater than or equal to 0")
    .default(0),
  discountType: DiscountTypeEnum.default("NONE"),
  estimateNumber: z
    .string()
    .trim()
    .min(1, "Estimate number is required")
    .max(50, "Estimate number is too long"),
  items: z.array(baseEstimateItemSchema).optional(),
  descriptiveItems: z.array(baseEstimateDescriptiveItemSchema).optional(),
  notes: z.record(z.string(), z.unknown()).nullish(),
  purchaseOrder: z.string().trim().max(100).nullish(),
  selectedPaymentMethodId: z.coerce
    .number()
    .int()
    .positive()
    .nullable()
    .optional(),
  taxMode: TaxModeEnum.default("NONE"),
  taxName: z.string().trim().max(100).nullish(),
  taxPercentage: nullableOptional(
    z.coerce
      .number()
      .min(0, "Tax percentage must be between 0 and 100")
      .max(100, "Tax percentage must be between 0 and 100"),
  ),
  terms: z.record(z.string(), z.unknown()).nullish(),
  requireSignature: z.boolean().default(false).optional(),
});

export type EstimateItemBase = z.infer<typeof baseEstimateItemSchema>;
export type EstimateDescriptiveItemBase = z.infer<
  typeof baseEstimateDescriptiveItemSchema
>;
export type EstimateBase = z.infer<typeof baseEstimateSchema>;
