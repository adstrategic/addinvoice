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

/**
 * Map backend status to UI status string
 */
export function mapStatusToUI(status: InvoiceStatus): string {
  const statusMap: Record<InvoiceStatus, string> = {
    DRAFT: "draft",
    SENT: "issued",
    VIEWED: "issued",
    PAID: "paid",
    OVERDUE: "pending",
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
    pending: "OVERDUE",
    paid: "PAID",
  };
  return statusMap[uiStatus] || null;
}
