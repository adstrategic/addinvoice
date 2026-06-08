import { listProposalsResponseSchema } from "@addinvoice/schemas";

export const proposalResponseListSchema = listProposalsResponseSchema;

export type ProposalResponseList = ReturnType<
  typeof proposalResponseListSchema.parse
>;
