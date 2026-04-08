/**
 * Enums used by schemas. Values match Prisma schema so backend can use them directly.
 * Defined here so @addinvoice/schemas has no dependency on @addinvoice/db (avoids pg in frontend bundle).
 */

export const EstimateStatus = {
  DRAFT: "DRAFT",
  SENT: "SENT",
  ACCEPTED: "ACCEPTED",
  REJECTED: "REJECTED",
  INVOICED: "INVOICED",
} as const;
export type EstimateStatus =
  (typeof EstimateStatus)[keyof typeof EstimateStatus];

export const TaxMode = {
  BY_PRODUCT: "BY_PRODUCT",
  BY_TOTAL: "BY_TOTAL",
  NONE: "NONE",
} as const;
export type TaxMode = (typeof TaxMode)[keyof typeof TaxMode];

export const QuantityUnit = {
  DAYS: "DAYS",
  HOURS: "HOURS",
  UNITS: "UNITS",
} as const;
export type QuantityUnit = (typeof QuantityUnit)[keyof typeof QuantityUnit];

export const DiscountType = {
  PERCENTAGE: "PERCENTAGE",
  FIXED: "FIXED",
  NONE: "NONE",
} as const;
export type DiscountType = (typeof DiscountType)[keyof typeof DiscountType];

export const AcceptedBy = {
  CLIENT: "CLIENT",
  END_CUSTOMER: "END_CUSTOMER",
} as const;
export type AcceptedBy = (typeof AcceptedBy)[keyof typeof AcceptedBy];
