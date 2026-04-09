import type { DiscountType, TaxMode } from "@/features/invoices/types/api";
import type {
  CreateEstimateItemDTO,
  EstimateItemResponse,
} from "@addinvoice/schemas";

/**
 * Calculate item total with tax
 */
export function calculateItemTotal(item: EstimateItemResponse): number {
  const subtotal = item.quantity * item.unitPrice;
  const taxAmount = (subtotal * (item.tax ?? 0)) / 100;
  return subtotal + taxAmount;
}

interface EstimateDraftTotalsInput {
  discount: number;
  discountType: DiscountType;
  taxMode: TaxMode;
  taxPercentage: number | null;
}

export function calculateDraftEstimateTotals(
  estimate: EstimateDraftTotalsInput,
  items: CreateEstimateItemDTO[],
): {
  subtotal: number;
  total: number;
  totalTax: number;
} {
  const itemTotals = items.map((item) => {
    const baseAmount = item.quantity * item.unitPrice;
    let itemTotalAfterDiscount = baseAmount;

    if (item.discountType === "PERCENTAGE") {
      itemTotalAfterDiscount = baseAmount - (baseAmount * item.discount) / 100;
    } else if (item.discountType === "FIXED") {
      itemTotalAfterDiscount = baseAmount - item.discount;
    }

    return itemTotalAfterDiscount;
  });

  const subtotal = itemTotals.reduce((sum, total) => sum + total, 0);

  let subtotalAfterDiscount = subtotal;
  if (estimate.discountType === "PERCENTAGE") {
    subtotalAfterDiscount = subtotal - (subtotal * estimate.discount) / 100;
  } else if (estimate.discountType === "FIXED") {
    subtotalAfterDiscount = subtotal - estimate.discount;
  }

  let totalTax = 0;
  if (subtotal !== 0) {
    const ratio = subtotalAfterDiscount / subtotal;

    if (estimate.taxMode === "BY_PRODUCT") {
      totalTax = items.reduce((sum, item, index) => {
        const itemTaxableAfterDiscount = (itemTotals[index] ?? 0) * ratio;
        return sum + (itemTaxableAfterDiscount * (item.tax ?? 0)) / 100;
      }, 0);
    } else if (estimate.taxMode === "BY_TOTAL" && estimate.taxPercentage) {
      const taxableSubtotal = items.reduce(
        (sum, item, index) =>
          item.vatEnabled ? sum + (itemTotals[index] ?? 0) : sum,
        0,
      );
      const taxableAfterDiscount = taxableSubtotal * ratio;
      totalTax = (taxableAfterDiscount * estimate.taxPercentage) / 100;
    }
  }

  return {
    subtotal,
    total: subtotalAfterDiscount + totalTax,
    totalTax,
  };
}
