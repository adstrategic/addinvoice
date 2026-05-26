import z from "zod";
import { EstimateStatusEnum } from "../estimates/estimate.base.js";
import { ProposalStatusEnum } from "../proposals/proposal.base.js";
import { fixedDateFromPrisma } from "../shared/date.js";

const publicClientSummarySchema = z.object({
  name: z.string(),
  email: z.string().email().optional(),
});

const publicBusinessSummarySchema = z.object({
  name: z.string(),
});

export const publicInvoiceSummarySchema = z.object({
  type: z.literal("invoice"),
  status: z.enum(["SENT", "VIEWED", "PAID", "OVERDUE"]),
  invoiceNumber: z.string(),
  total: z.number(),
  balance: z.number(),
  currency: z.string(),
  issueDate: z
    .string()
    .transform((val) => fixedDateFromPrisma(new Date(val))),
  dueDate: z
    .string()
    .transform((val) => fixedDateFromPrisma(new Date(val))),
  paymentLink: z.string().nullable(),
  client: publicClientSummarySchema,
  business: publicBusinessSummarySchema,
});

export const publicDocumentEstimateSummarySchema = z.object({
  type: z.literal("estimate"),
  status: EstimateStatusEnum,
  estimateNumber: z.string(),
  total: z.number(),
  currency: z.string(),
  requireSignature: z.boolean(),
  signingToken: z.string().nullable(),
  client: publicClientSummarySchema,
  business: publicBusinessSummarySchema,
});

export const publicDocumentProposalSummarySchema = z.object({
  type: z.literal("proposal"),
  status: ProposalStatusEnum,
  proposalNumber: z.string(),
  total: z.number(),
  currency: z.string(),
  requireSignature: z.boolean(),
  signingToken: z.string().nullable(),
  client: publicClientSummarySchema,
  business: publicBusinessSummarySchema,
});

export const publicDocumentSummarySchema = z.discriminatedUnion("type", [
  publicInvoiceSummarySchema,
  publicDocumentEstimateSummarySchema,
  publicDocumentProposalSummarySchema,
]);

export type PublicInvoiceSummary = z.infer<typeof publicInvoiceSummarySchema>;
export type PublicDocumentEstimateSummary = z.infer<
  typeof publicDocumentEstimateSummarySchema
>;
export type PublicDocumentProposalSummary = z.infer<
  typeof publicDocumentProposalSummarySchema
>;
export type PublicDocumentSummary = z.infer<typeof publicDocumentSummarySchema>;
