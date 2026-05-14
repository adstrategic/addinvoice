import z from "zod";
import { ProposalStatus } from "../enums.js";

export const ProposalStatusEnum = z.nativeEnum(ProposalStatus);

export const baseProposalDescriptiveItemSchema = z.object({
  title: z.string().trim().min(1).max(255),
  description: z.record(z.string(), z.unknown()),
});

export const baseProposalSchema = z.object({
  estimateId: z.coerce.number().int().positive(),
  clientId: z.coerce.number().int().positive(),
  businessId: z.coerce.number().int().positive(),
  clientEmail: z.string().trim().email(),
  clientPhone: z.string().trim().max(50).nullish(),
  clientAddress: z.string().trim().max(200).nullish(),
  proposalNumber: z.string().trim().min(1).max(50),
  purchaseOrder: z.string().trim().max(100).nullish(),
  currency: z.string().trim().min(1).max(10).default("USD"),
  total: z.number(),
  notes: z.record(z.string(), z.unknown()).nullish(),
  terms: z.record(z.string(), z.unknown()).nullish(),
  exclusions: z.record(z.string(), z.unknown()).nullish(),
  summary: z.record(z.string(), z.unknown()).nullish(),
  timelineStartDate: z.coerce.date().nullish(),
  timelineEndDate: z.coerce.date().nullish(),
  requireSignature: z.boolean().default(true),
  selectedPaymentMethodId: z.coerce.number().int().positive().nullable().optional(),
});

export type ProposalDescriptiveItemBase = z.infer<typeof baseProposalDescriptiveItemSchema>;
export type ProposalBase = z.infer<typeof baseProposalSchema>;
