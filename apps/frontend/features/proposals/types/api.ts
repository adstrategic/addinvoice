import { ProposalStatusEnum } from "@addinvoice/schemas";
import type z from "zod";

type ProposalStatus = z.infer<typeof ProposalStatusEnum>;

export const PROPOSAL_FILTER_VALUES = [
  "all",
  "sent",
  "accepted",
  "rejected",
  "invoiced",
] as const;

export function mapStatusToUI(status: ProposalStatus): string {
  const map: Record<ProposalStatus, string> = {
    SENT: "sent",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    INVOICED: "invoiced",
  };
  return map[status] || "sent";
}

export function mapUIToStatus(uiStatus: string): ProposalStatus | null {
  const map: Record<string, ProposalStatus> = {
    sent: "SENT",
    accepted: "ACCEPTED",
    rejected: "REJECTED",
    invoiced: "INVOICED",
  };
  return map[uiStatus] || null;
}

export function statusFilterToApiParam(
  statusFilter: string,
): string | undefined {
  if (!statusFilter || statusFilter === "all") return undefined;
  return mapUIToStatus(statusFilter) ?? undefined;
}
