import z from "zod";
import { baseProposalDescriptiveItemSchema } from "./proposal.base.js";

// No create schema (proposals are always created from an estimate via a dedicated endpoint)

export const updateProposalSchema = z.object({
  total: z.number().positive().optional(),
  notes: z.record(z.string(), z.unknown()).nullish(),
  terms: z.record(z.string(), z.unknown()).nullish(),
  exclusions: z.record(z.string(), z.unknown()).nullish(),
  summary: z.record(z.string(), z.unknown()).nullish(),
  timelineStartDate: z.coerce.date().nullish(),
  timelineEndDate: z.coerce.date().nullish(),
  selectedPaymentMethodId: z.coerce.number().int().positive().nullable().optional(),
});

export const createProposalDescriptiveItemSchema = baseProposalDescriptiveItemSchema;
export const updateProposalDescriptiveItemSchema = baseProposalDescriptiveItemSchema.partial();

export type UpdateProposalDTO = z.infer<typeof updateProposalSchema>;
export type CreateProposalDescriptiveItemDTO = z.infer<typeof createProposalDescriptiveItemSchema>;
export type UpdateProposalDescriptiveItemDTO = z.infer<typeof updateProposalDescriptiveItemSchema>;
