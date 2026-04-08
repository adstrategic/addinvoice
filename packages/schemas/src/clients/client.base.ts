import { z } from "zod";
import { nullableOptional } from "../shared/nullable.js";

/**
 * Phone number regex for international format.
 * Pattern: +[1-9][digits] where digits are 1-14 more digits.
 * Example: +573011234567 (Colombia), +1234567890 (USA)
 */
export const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Flat client shape (base layer).
 * Used for response relations and as the foundation for request/response schemas.
 */
export const ClientBase = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Client name is required")
    .max(255, "Client name is too long"),
  email: z.string().trim().email("Invalid email address"),
  phone: nullableOptional(
    z
      .string()
      .trim()
      .regex(
        PHONE_REGEX,
        "The phone must have a valid international format (e.g. +573011234567)",
      ),
  ),
  address: nullableOptional(
    z.string().trim().max(100, "Address cannot exceed 100 characters"),
  ),
  nit: nullableOptional(
    z.string().trim().max(15, "NIT/Cedula cannot exceed 15 characters"),
  ),
  businessName: nullableOptional(
    z.string().trim().max(100, "Business name cannot exceed 100 characters"),
  ),
  reminderBeforeDueIntervalDays: nullableOptional(
    z.coerce.number().int().positive("Must be a positive number of days"),
  ),
  reminderAfterDueIntervalDays: nullableOptional(
    z.coerce.number().int().positive("Must be a positive number of days"),
  ),
});

export type ClientBase = z.infer<typeof ClientBase>;
