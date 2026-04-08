import type { EstimateItemResponse } from "@addinvoice/schemas";

/**
 * Calculate item total with tax
 */
export function calculateItemTotal(item: EstimateItemResponse): number {
  const subtotal = item.quantity * item.unitPrice;
  const taxAmount = (subtotal * (item.tax ?? 0)) / 100;
  return subtotal + taxAmount;
}
