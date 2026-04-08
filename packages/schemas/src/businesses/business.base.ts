import { TaxMode } from "../enums.js";
import { z } from "zod";
import { nullableOptional } from "../shared/nullable.js";

const defaultTaxModeEnum = z.nativeEnum(TaxMode);

/**
 * Flat business shape (base layer).
 * Used for estimate response relations. No nested relations.
 */
export const businessBaseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Business name is required")
    .max(255, "Business name is too long"),
  email: z.string().trim().email("Invalid email address"),
  nit: nullableOptional(
    z.string().trim().max(50, "NIT/Tax ID cannot exceed 50 characters"),
  ),
  address: z
    .string()
    .trim()
    .min(1, "Address cannot be empty")
    .max(500, "Address cannot exceed 500 characters"),

  phone: z
    .string()
    .trim()
    .min(1, "Phone is required")
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "Phone must have a valid international format (e.g. +573011234567)",
    ),
  logo: nullableOptional(z.string().url("Invalid logo URL")),
  defaultTaxMode: defaultTaxModeEnum.optional().nullable(),
  defaultTaxName: nullableOptional(z.string().trim()),
  defaultTaxPercentage: nullableOptional(z.number().min(0).max(100)),
  defaultNotes: nullableOptional(z.string()),
  defaultTerms: nullableOptional(z.string()),
});

export type BusinessBase = z.infer<typeof businessBaseSchema>;
