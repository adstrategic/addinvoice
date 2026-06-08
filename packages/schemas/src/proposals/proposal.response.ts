import z from "zod";
import { AcceptedBy, ProposalStatus } from "../enums.js";
import { clientResponseSchema } from "../clients/client.response.js";
import { businessResponseSchema } from "../businesses/business.response.js";
import { baseProposalDescriptiveItemSchema, baseProposalSchema, ProposalStatusEnum } from "./proposal.base.js";
import { fixedDateFromPrisma } from "../shared/date.js";

export const proposalDescriptiveItemResponseSchema = baseProposalDescriptiveItemSchema.extend({
  id: z.number().int().positive(),
  proposalId: z.number().int().positive(),
  sortOrder: z.number().int().nonnegative(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const proposalResponseSchema = baseProposalSchema.extend({
  id: z.number().int().positive(),
  sequence: z.number().int().positive(),
  workspaceId: z.number().int().positive(),
  status: ProposalStatusEnum,
  timelineStartDate: z
    .string()
    .transform((val) => fixedDateFromPrisma(new Date(val)))
    .nullable(),
  timelineEndDate: z
    .string()
    .transform((val) => fixedDateFromPrisma(new Date(val)))
    .nullable(),
  rejectionReason: z.string().nullable().optional(),
  signingToken: z.string().nullable().optional(),
  publicSlug: z.string().nullable().optional(),
  signatureData: z.unknown().nullable().optional(),
  sentAt: z.coerce.date().nullable(),
  viewedAt: z.coerce.date().nullable().optional(),
  voidedAt: z.coerce.date().nullable().optional(),
  acceptedAt: z.coerce.date().nullable().optional(),
  acceptedBy: z.nativeEnum(AcceptedBy).nullable().optional(),
  convertedToInvoiceId: z.number().int().positive().nullable().optional(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  business: businessResponseSchema,
  client: clientResponseSchema,
  descriptiveItems: z.array(proposalDescriptiveItemResponseSchema).optional(),
});

export const proposalDashboardResponseSchema = proposalResponseSchema.extend({
  descriptiveItemCount: z.number().int().min(0),
});

export const publicProposalSummarySchema = proposalResponseSchema.omit({
  createdAt: true,
  updatedAt: true,
  workspaceId: true,
  signingToken: true,
  sentAt: true,
  acceptedAt: true,
  acceptedBy: true,
  convertedToInvoiceId: true,
});

export const proposalListStatsSchema = z.object({
  /** Workspace-wide count (all statuses); not scoped to list status tab */
  total: z.number().int().nonnegative(),
});

export const listProposalsResponseSchema = z.object({
  data: z.array(proposalDashboardResponseSchema),
  pagination: z.object({
    limit: z.number().int().positive(),
    page: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
  stats: proposalListStatsSchema,
});

export type ProposalDescriptiveItemResponse = z.infer<typeof proposalDescriptiveItemResponseSchema>;
export type ProposalResponse = z.infer<typeof proposalResponseSchema>;
export type ProposalDashboardResponse = z.infer<typeof proposalDashboardResponseSchema>;
export type ProposalListStats = z.infer<typeof proposalListStatsSchema>;
export type ListProposalsResponse = z.infer<typeof listProposalsResponseSchema>;
export type PublicProposalSummary = z.infer<typeof publicProposalSummarySchema>;
