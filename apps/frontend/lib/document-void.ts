import type { InvoiceResponse } from "@/features/invoices/schemas/invoice.schema";
import type { EstimateDashboardResponse } from "@addinvoice/schemas";
import type { ProposalDashboardResponse } from "@addinvoice/schemas";
import type { AdvanceListItemResponse } from "@addinvoice/schemas";

export function canVoidInvoice(invoice: Pick<InvoiceResponse, "status" | "payments">): boolean {
  if (invoice.status === "DRAFT" || invoice.status === "VOIDED" || invoice.status === "PAID") {
    return false;
  }
  return (invoice.payments?.length ?? 0) === 0;
}

export function canVoidEstimate(
  estimate: Pick<EstimateDashboardResponse, "status">,
): boolean {
  const blocked = new Set(["DRAFT", "VOIDED", "INVOICED", "PROPOSAL"]);
  return !blocked.has(estimate.status);
}

export function canVoidProposal(
  proposal: Pick<ProposalDashboardResponse, "status">,
): boolean {
  return proposal.status !== "INVOICED" && proposal.status !== "VOIDED";
}

export function canVoidAdvance(
  advance: Pick<AdvanceListItemResponse, "status">,
): boolean {
  return advance.status === "ISSUED";
}
