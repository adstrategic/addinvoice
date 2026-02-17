import { z } from "zod";

// ===== VALIDATION SCHEMAS (for middleware) =====

/**
 * Schema for listing clients
 */
export const listClientsSchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(30).optional().default(10),
  search: z.string().optional(),
});

/**
 * Schema for getting client by sequence
 */
export const getClientBySequenceSchema = z.object({
  sequence: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

/**
 * Schema for getting client by ID (for update/delete)
 */
export const getClientByIdSchema = z.object({
  id: z.coerce.number().int().positive("The ID must be a positive number"),
});

/**
 * Schema for creating a client
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
    .min(1, "The phone is required")
    .regex(
      /^\+[1-9]\d{1,14}$/,
      "The phone must have a valid international format (e.g. +573011234567)",
    )
    .nullish(),
  address: z
    .string({ required_error: "Address is required" })
    .trim()
    .min(1, "Address cannot be empty")
    .max(100, "Address cannot exceed 100 characters")
    .nullish(),
  nit: z
    .string({ required_error: "NIT/Cedula is required" })
    .trim()
    .min(1, "NIT/Cedula cannot be empty")
    .max(15, "NIT/Cedula cannot exceed 15 characters")
    .nullish(),
  businessName: z
    .string({ required_error: "Business name is required" })
    .trim()
    .min(1, "Business name cannot be empty")
    .max(100, "Business name cannot exceed 100 characters")
    .nullish(),
  // Reminder before due date: every N days (null = disabled)
  reminderBeforeDueIntervalDays: z
    .number()
    .int()
    .positive("Must be a positive number of days")
    .nullish(),
  // Reminder after due date: every N days (null = disabled)
  reminderAfterDueIntervalDays: z
    .number()
    .int()
    .positive("Must be a positive number of days")
    .nullish(),
});

/**
 * Schema for client entity
 */
export const clientEntitySchema = createClientSchema.extend({
  id: z.number().int().positive(),
  sequence: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

/**
 * Schema for updating a client
 */
export const updateClientSchema = createClientSchema.partial();

// ===== DTOs (for the service) =====

export type ClientEntity = z.infer<typeof clientEntitySchema>;
export type ListClientsQuery = z.infer<typeof listClientsSchema>;
export type GetClientBySequenceParams = z.infer<
  typeof getClientBySequenceSchema
>;
export type GetClientByIdParams = z.infer<typeof getClientByIdSchema>;
export type CreateClientDto = z.infer<typeof createClientSchema>;
export type UpdateClientDto = z.infer<typeof updateClientSchema>;
