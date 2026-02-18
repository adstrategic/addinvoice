import { z } from "zod";

/**
 * Phone number regex for international format.
 * Pattern: +[1-9][digits] where digits are 1-14 more digits.
 * Example: +573011234567 (Colombia), +1234567890 (USA)
 */
export const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Schema for creating a client.
 * Single source of truth for backend and agent.
 */
export const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Client name is required")
    .max(255, "Client name is too long"),
  email: z.string().trim().email("Invalid email address"),
  phone: z
    .string()
    .trim()
    .regex(
      PHONE_REGEX,
      "The phone must have a valid international format (e.g. +573011234567)"
    )
    .nullish(),
  address: z
    .string()
    .trim()
    .max(100, "Address cannot exceed 100 characters")
    .nullish(),
  nit: z
    .string()
    .trim()
    .max(15, "NIT/Cedula cannot exceed 15 characters")
    .nullish(),
  businessName: z
    .string()
    .trim()
    .max(100, "Business name cannot exceed 100 characters")
    .nullish(),
  reminderBeforeDueIntervalDays: z
    .number()
    .int()
    .positive("Must be a positive number of days")
    .nullish(),
  reminderAfterDueIntervalDays: z
    .number()
    .int()
    .positive("Must be a positive number of days")
    .nullish(),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
