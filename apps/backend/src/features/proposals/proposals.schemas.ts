import { ProposalStatusEnum } from "@addinvoice/schemas";
import { z } from "zod";

// ===== VALIDATION SCHEMAS (for middleware) =====

export const listProposalsSchema = z.object({
  businessId: z.coerce.number().int().positive().optional(),
  clientId: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().min(1).max(50).optional().default(10),
  page: z.coerce.number().int().min(1).optional().default(1),
  search: z.string().optional(),
  status: ProposalStatusEnum.optional(),
});

export const getProposalBySequenceSchema = z.object({
  sequence: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

export const getProposalByIdSchema = z.object({
  proposalId: z.coerce
    .number()
    .int()
    .positive("The ID must be a positive number"),
});

export const getProposalDescriptiveItemByIdSchema = z.object({
  proposalId: z.coerce.number().int().positive(),
  descriptiveItemId: z.coerce
    .number()
    .int()
    .positive("The descriptive item ID must be a positive number"),
});

export const getEstimateBySequenceForProposalSchema = z.object({
  estimateSequence: z.coerce
    .number()
    .int()
    .positive("The sequence must be a positive number"),
});

export const convertEstimateToProposalBodySchema = z.object({
  email: z.string().trim().email("Valid email is required").optional(),
  subject: z.string().trim().optional(),
  message: z.string().trim().optional(),
  requireSignature: z.boolean().optional(),
});

// ===== PUBLIC (no auth) =====

export const getProposalByTokenParamsSchema = z.object({
  token: z.string().min(1, "Token is required"),
});

export const acceptProposalBodySchema = z.object({
  fullName: z.string().trim().min(1, "Full name is required"),
  signatureData: z.unknown().optional(),
});

export const rejectProposalBodySchema = z.object({
  rejectionReason: z.string().trim().max(2000).optional(),
});

// ===== DTOs =====

export type ListProposalsQuery = z.infer<typeof listProposalsSchema>;
export type GetProposalBySequenceParams = z.infer<typeof getProposalBySequenceSchema>;
export type GetProposalByIdParams = z.infer<typeof getProposalByIdSchema>;
export type GetProposalDescriptiveItemByIdParams = z.infer<typeof getProposalDescriptiveItemByIdSchema>;
