import { EstimateStatusEnum } from "@addinvoice/schemas";
import { z } from "zod";

// ===== VALIDATION SCHEMAS (for middleware) =====

/**
 * Schema for listing estimates.
 * status: optional string, can be a single value or comma-separated (e.g. SENT,VIEWED).
 */
export const listEstimatesSchema = z.object({
  businessId: z.coerce.number().int().positive().optional(),
  clientId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
  status: EstimateStatusEnum.optional(),
});

/**
 * Schema for getting estimate by Sequence
 */
export const getEstimateBySequenceSchema = z.object({
  sequence: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

/**
 * Schema for GET /estimates/next-number query (businessId required)
 */
export const getNextEstimateNumberQuerySchema = z.object({
  businessId: z.coerce.number().int().positive("businessId is required"),
});

/**
 * Schema for getting estimate by ID
 */
export const getEstimateByIdSchema = z.object({
  estimateId: z.coerce
    .number()
    .int()
    .positive("The ID must be a positive number"),
});

/**
 * Schema for POST /estimates/:sequence/send (enqueue send estimate)
 */
export const sendEstimateBodySchema = z.object({
  email: z.string().trim().email("Valid email is required"),
  message: z.string().trim().min(1, "Message is required"),
  subject: z.string().trim().min(1, "Subject is required"),
});

/**
 * Body for POST /estimates/from-voice-audio (multipart/form-data).
 * Audio file is handled by multer; only text fields are validated here.
 */
export const fromVoiceAudioBodySchema = z.object({
  businessId: z.coerce.number().int().positive("Business is required"),
  clientId: z.coerce.number().int().positive("Client is required"),
});

/**
 * Schema for getting estimate item by ID
 */
export const getEstimateItemByIdSchema = z.object({
  estimateId: z.coerce.number().int().positive(),
  itemId: z.coerce
    .number()
    .int()
    .positive("The item ID must be a positive number"),
});

// ===== DTOs (for the service) =====

export type GetEstimateByIdParams = z.infer<typeof getEstimateByIdSchema>;
export type GetEstimateBySequenceParams = z.infer<
  typeof getEstimateBySequenceSchema
>;
export type GetEstimateItemByIdParams = z.infer<
  typeof getEstimateItemByIdSchema
>;
export type ListEstimatesQuery = z.infer<typeof listEstimatesSchema>;

// ===== PUBLIC (no auth) =====

export const getEstimateByTokenParamsSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const acceptEstimateBodySchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  signatureData: z.unknown().optional(),
});

export const rejectEstimateBodySchema = z.object({
  rejectionReason: z.string().trim().max(2000).optional(),
});
