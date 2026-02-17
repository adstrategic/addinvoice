/**
 * Invoice Enums and Utility Functions
 * Enums and utility functions for invoice feature
 * Response types are now defined in schemas/invoice.schema.ts
 */

/**
 * Invoice status enum matching backend
 */
export type InvoiceStatus = "DRAFT" | "SENT" | "VIEWED" | "PAID" | "OVERDUE";

/**
 * Tax mode enum matching backend
 */
export type TaxMode = "BY_PRODUCT" | "BY_TOTAL" | "NONE";

/**
 * Quantity unit enum matching backend
 */
export type QuantityUnit = "DAYS" | "HOURS" | "UNITS";

/**
 * Discount type enum matching backend
 */
export type DiscountType = "PERCENTAGE" | "FIXED" | "NONE";

/** URL/UI filter values for invoice list (single source of truth) */
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
export function mapStatusToUI(status: InvoiceStatus): string {
  const statusMap: Record<InvoiceStatus, string> = {
    DRAFT: "draft",
    SENT: "issued",
    VIEWED: "issued",
    PAID: "paid",
    OVERDUE: "overdue",
  };
  return statusMap[status] || "draft";
}

/**
 * Map UI status string to backend status
 */
export function mapUIToStatus(uiStatus: string): InvoiceStatus | null {
  const statusMap: Record<string, InvoiceStatus> = {
    draft: "DRAFT",
    issued: "SENT",
    overdue: "OVERDUE",
    paid: "PAID",
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
