import { EstimateStatusEnum } from "@addinvoice/schemas";
import type z from "zod";

type EstimateStatus = z.infer<typeof EstimateStatusEnum>;

/** URL/UI filter values for estimate list (single source of truth) */
export const INVOICE_FILTER_VALUES = [
  "all",
  "paid",
  "overdue",
  "issued",
  "draft",
] as const;

/**
 * Map backend status to UI status string
 */
export function mapStatusToUI(status: EstimateStatus): string {
  const statusMap: Record<EstimateStatus, string> = {
    DRAFT: "draft",
    SENT: "sent",
    ACCEPTED: "accepted",
    REJECTED: "rejected",
    INVOICED: "invoiced",
  };
  return statusMap[status] || "draft";
}

/**
 * Map UI status string to backend status
 */
export function mapUIToStatus(uiStatus: string): EstimateStatus | null {
  const statusMap: Record<string, EstimateStatus> = {
    draft: "DRAFT",
    sent: "SENT",
    accepted: "ACCEPTED",
    rejected: "REJECTED",
    invoiced: "INVOICED",
  };
  return statusMap[uiStatus] || null;
}

/**
 * Map URL status filter (UI value) to API list param.
 * "all" → undefined; "issued" → SENT only (VIEWED not used in list filter); others → single backend status.
 */
export function statusFilterToApiParam(
  statusFilter: string,
): string | undefined {
  if (!statusFilter || statusFilter === "all") return undefined;
  const single = mapUIToStatus(statusFilter);
  return single ?? undefined;
}
