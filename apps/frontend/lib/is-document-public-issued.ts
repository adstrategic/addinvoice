/**
 * Whether the document has been issued/sent and may expose a public share link on detail UI.
 */
export function isInvoicePublicIssued(
  status: string,
): boolean {
  return ["SENT", "VIEWED", "PAID", "OVERDUE"].includes(status);
}

export function isEstimatePublicIssued(status: string): boolean {
  return status !== "DRAFT" && status !== "VOIDED";
}

export function canSendEstimate(estimate: {
  status: string;
  itemCount?: number | null;
}): boolean {
  if ((estimate.itemCount ?? 0) === 0) {
    return false;
  }
  return !["PROPOSAL", "INVOICED", "VOIDED"].includes(estimate.status);
}

export function canSendInvoice(invoice: { status: string }): boolean {
  return invoice.status !== "VOIDED";
}

/** Resend email from list (rejected proposals only). */
export function canSendProposalFromList(proposal: { status: string }): boolean {
  return proposal.status === "REJECTED";
}

/** Share / send from proposal detail (sent or resend after rejection). */
export function canSendProposalFromDetail(status: string): boolean {
  return status === "SENT" || status === "REJECTED";
}

export function canSendAdvance(advance: { status: string }): boolean {
  return advance.status !== "VOIDED";
}

export function isProposalPublicIssued(status: string): boolean {
  return ["SENT", "ACCEPTED", "REJECTED", "INVOICED"].includes(status);
}

export function isAdvancePublicIssued(status: string): boolean {
  return status === "ISSUED" || status === "INVOICED";
}
