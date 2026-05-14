import { proposalDashboardResponseSchema } from "@addinvoice/schemas";
import { z } from "zod";
import { paginationMetaSchema } from "@/lib/api/types";

export const proposalResponseListSchema = z.object({
  data: z.array(proposalDashboardResponseSchema),
  pagination: paginationMetaSchema,
});

export type ProposalResponseList = z.infer<typeof proposalResponseListSchema>;
