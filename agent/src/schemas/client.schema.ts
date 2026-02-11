import { z } from 'zod';

/**
 * Generic helper for nullable optional fields that converts empty strings to null
 * Matches frontend behavior from frontend/lib/utils.ts
 */
export const nullableOptional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess(
    (val) => (val === '' || val === undefined ? null : val),
    schema.nullable()
  );

/**
 * Phone number regex pattern for international format
 * Pattern: +[1-9][digits] where digits are 1-14 more digits
 * Total: 2-15 digits after the + (3-16 characters including +)
 * Example: +573011234567 (Colombia), +1234567890 (USA)
 */
export const PHONE_REGEX = /^\+[1-9]\d{1,14}$/;

/**
 * Client validation schema
 * Copied from frontend/features/clients/schema/clients.schema.ts
 * Must match backend clients.schemas.ts createClientSchema
 */
export const createClientSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Client name is required')
    .max(255, 'Client name is too long'),
  email: z.email('Invalid email address'),
  phone: nullableOptional(
    z
      .string()
      .trim()
      .regex(
        PHONE_REGEX,
        'The phone must have a valid international format (e.g. +573011234567)'
      )
  ),
  address: nullableOptional(
    z.string().trim().max(100, 'Address cannot exceed 100 characters')
  ),
  nit: nullableOptional(
    z.string().trim().max(15, 'NIT/Cedula cannot exceed 15 characters')
  ),
  businessName: nullableOptional(
    z.string().trim().max(100, 'Business name cannot exceed 100 characters')
  ),
});
