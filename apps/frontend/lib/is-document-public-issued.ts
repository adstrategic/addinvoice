/**
 * Whether the document has been issued/sent and may expose a public share link on detail UI.
 */
export function isInvoicePublicIssued(
  status: string,
): boolean {
  return ["SENT", "VIEWED", "PAID", "OVERDUE"].includes(status);
}

export function isEstimatePublicIssued(status: string): boolean {
  return status !== "DRAFT";
}

export function isProposalPublicIssued(status: string): boolean {
  return ["SENT", "ACCEPTED", "REJECTED", "INVOICED"].includes(status);
}
