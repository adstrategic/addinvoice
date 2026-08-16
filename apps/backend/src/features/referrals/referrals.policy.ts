import type { SubscriptionPlan } from "@addinvoice/db";

/**
 * Pure rules of the referral program. Kept free of Prisma and Stripe calls so
 * the money math can be reasoned about — and tested — on its own.
 */

/**
 * Days a commission stays PENDING before it becomes payable. Covers the window
 * in which a refund or dispute could still claw the payment back.
 */
export const REFERRAL_HOLD_DAYS = Number(process.env.REFERRAL_HOLD_DAYS ?? 30);

/** Percentage taken off the referred customer's first invoice. */
export const REFERRAL_DISCOUNT_PCT = 20;

/** Default share of each paid invoice earned by the referrer. */
export const DEFAULT_COMMISSION_RATE_PCT = 15;

/** Default length of the commission window, in months from conversion. */
export const DEFAULT_COMMISSION_MONTHS = 12;

/**
 * Plans that participate in the referral program at all.
 * LIFETIME is excluded entirely — no discount and no commission.
 */
export function isReferralEligiblePlan(plan: null | string): boolean {
  return plan === "MINIMUM" || plan === "ESSENTIAL";
}

/**
 * Whether the customer discount may be applied to this purchase.
 *
 * Yearly prices are already sold as a discounted upsell, so stacking the
 * referral discount on top would double-discount them. Stripe cannot express
 * this itself: a coupon's `applies_to` filters by product, and each plan's
 * product holds both the monthly and the yearly price — so the interval check
 * has to happen here.
 */
export function isDiscountEligible(
  plan: null | string,
  priceInterval: null | string | undefined,
): boolean {
  return isReferralEligiblePlan(plan) && priceInterval === "month";
}

/**
 * Commission base for an invoice: what the customer actually paid, less tax.
 *
 * Using amount_paid rather than total means proration, partial payments and
 * the first-invoice discount are all handled without special cases.
 */
export function getCommissionBaseCents(invoice: {
  amount_paid: number;
  tax?: null | number;
}): number {
  return Math.max(0, invoice.amount_paid - (invoice.tax ?? 0));
}

/**
 * Commission owed on a given base, rounded to the nearest cent.
 */
export function calculateCommissionCents(
  baseAmountCents: number,
  ratePct: number,
): number {
  if (baseAmountCents <= 0 || ratePct <= 0) return 0;
  return Math.round((baseAmountCents * ratePct) / 100);
}

/**
 * End of the commission window: `months` after conversion.
 *
 * Clamps the day-of-month so converting on the 31st does not roll forward into
 * the following month (JS Date would turn Jan 31 + 1 month into Mar 3).
 */
export function addMonths(from: Date, months: number): Date {
  const result = new Date(from.getTime());
  const targetDay = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() + months);

  const daysInTargetMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(targetDay, daysInTargetMonth));
  return result;
}

/**
 * Whether an invoice paid at `paidAt` still falls inside the commission window.
 * A referral with no end date has not converted yet and earns nothing.
 */
export function isWithinCommissionWindow(
  paidAt: Date,
  commissionEndsAt: Date | null,
): boolean {
  if (!commissionEndsAt) return false;
  return paidAt.getTime() <= commissionEndsAt.getTime();
}

/**
 * When a commission accrued now becomes payable.
 */
export function getAvailableAt(from: Date = new Date()): Date {
  const availableAt = new Date(from.getTime());
  availableAt.setUTCDate(availableAt.getUTCDate() + REFERRAL_HOLD_DAYS);
  return availableAt;
}

/**
 * Narrowing helper so callers can pass a Prisma plan enum straight through.
 */
export function isReferralEligibleSubscriptionPlan(
  plan: null | SubscriptionPlan,
): boolean {
  return isReferralEligiblePlan(plan);
}

export interface PlanProductIds {
  ESSENTIAL: string;
  LIFETIME: string;
  MINIMUM: string;
}

/**
 * Work out which plan an invoice is for, from the products on its line items.
 *
 * The workspace's cached subscriptionPlan cannot be trusted here: Stripe does
 * not guarantee that checkout.session.completed (which sets the cache) arrives
 * before invoice.paid. Reading the plan off the invoice makes commission
 * accrual independent of webhook ordering, so the very first invoice — the
 * discounted one the referrer is most likely to ask about — is never missed.
 */
export function resolvePlanFromProductIds(
  invoiceProductIds: (null | string | undefined)[],
  productIds: PlanProductIds,
): null | string {
  for (const productId of invoiceProductIds) {
    if (!productId) continue;
    if (productId === productIds.MINIMUM) return "MINIMUM";
    if (productId === productIds.ESSENTIAL) return "ESSENTIAL";
    if (productId === productIds.LIFETIME) return "LIFETIME";
  }

  return null;
}
