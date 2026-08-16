import { describe, expect, it } from "vitest";

import {
  addMonths,
  calculateCommissionCents,
  getCommissionBaseCents,
  isDiscountEligible,
  isReferralEligiblePlan,
  isWithinCommissionWindow,
  resolvePlanFromProductIds,
} from "../referrals.policy.js";

const PRODUCT_IDS = {
  ESSENTIAL: "prod_essential",
  LIFETIME: "prod_lifetime",
  MINIMUM: "prod_minimum",
};

describe("referral discount eligibility", () => {
  it("discounts monthly MINIMUM and ESSENTIAL", () => {
    expect(isDiscountEligible("MINIMUM", "month")).toBe(true);
    expect(isDiscountEligible("ESSENTIAL", "month")).toBe(true);
  });

  it("never discounts yearly, which is already sold as a discounted upsell", () => {
    expect(isDiscountEligible("MINIMUM", "year")).toBe(false);
    expect(isDiscountEligible("ESSENTIAL", "year")).toBe(false);
  });

  it("never discounts LIFETIME, which is outside the program entirely", () => {
    expect(isDiscountEligible("LIFETIME", "month")).toBe(false);
    expect(isDiscountEligible("LIFETIME", undefined)).toBe(false);
  });
});

describe("commission eligibility by plan", () => {
  it("pays commission on both recurring plans regardless of interval", () => {
    expect(isReferralEligiblePlan("MINIMUM")).toBe(true);
    expect(isReferralEligiblePlan("ESSENTIAL")).toBe(true);
  });

  it("pays nothing on LIFETIME or an absent plan", () => {
    expect(isReferralEligiblePlan("LIFETIME")).toBe(false);
    expect(isReferralEligiblePlan("FREE_TRIAL")).toBe(false);
    expect(isReferralEligiblePlan(null)).toBe(false);
  });
});

describe("commission base", () => {
  it("excludes tax from the base", () => {
    expect(getCommissionBaseCents({ amount_paid: 1200, tax: 200 })).toBe(1000);
  });

  it("handles invoices with no tax", () => {
    expect(getCommissionBaseCents({ amount_paid: 960, tax: null })).toBe(960);
    expect(getCommissionBaseCents({ amount_paid: 960 })).toBe(960);
  });

  it("never returns a negative base", () => {
    expect(getCommissionBaseCents({ amount_paid: 100, tax: 500 })).toBe(0);
  });
});

describe("commission amount", () => {
  it("takes 15% of the discounted first invoice", () => {
    // $12 plan, 20% referral discount applied => $9.60 base.
    expect(calculateCommissionCents(960, 15)).toBe(144);
  });

  it("takes 15% of the full amount on later invoices", () => {
    expect(calculateCommissionCents(1200, 15)).toBe(180);
  });

  it("rounds to the nearest cent", () => {
    expect(calculateCommissionCents(999, 15)).toBe(150);
  });

  it("returns zero for zero or negative input", () => {
    expect(calculateCommissionCents(0, 15)).toBe(0);
    expect(calculateCommissionCents(1200, 0)).toBe(0);
  });
});

describe("commission window", () => {
  it("ends 12 months after conversion", () => {
    const converted = new Date("2026-08-15T00:00:00.000Z");
    expect(addMonths(converted, 12).toISOString()).toBe(
      "2027-08-15T00:00:00.000Z",
    );
  });

  it("clamps to the last valid day rather than overflowing the month", () => {
    // Naive date maths turns Jan 31 + 1 month into Mar 3.
    const converted = new Date("2026-01-31T00:00:00.000Z");
    expect(addMonths(converted, 1).toISOString()).toBe(
      "2026-02-28T00:00:00.000Z",
    );
  });

  it("includes an invoice paid exactly on the boundary", () => {
    const end = new Date("2027-08-15T00:00:00.000Z");
    expect(isWithinCommissionWindow(end, end)).toBe(true);
  });

  it("excludes an invoice paid after the window closes", () => {
    const end = new Date("2027-08-15T00:00:00.000Z");
    const paidAt = new Date("2027-08-15T00:00:01.000Z");
    expect(isWithinCommissionWindow(paidAt, end)).toBe(false);
  });

  it("pays nothing when the referral never converted", () => {
    expect(isWithinCommissionWindow(new Date(), null)).toBe(false);
  });
});

describe("resolving the plan from an invoice", () => {
  it("identifies each plan from its product id", () => {
    expect(resolvePlanFromProductIds(["prod_minimum"], PRODUCT_IDS)).toBe(
      "MINIMUM",
    );
    expect(resolvePlanFromProductIds(["prod_essential"], PRODUCT_IDS)).toBe(
      "ESSENTIAL",
    );
    expect(resolvePlanFromProductIds(["prod_lifetime"], PRODUCT_IDS)).toBe(
      "LIFETIME",
    );
  });

  it("skips line items with no resolvable product", () => {
    expect(
      resolvePlanFromProductIds(
        [null, undefined, "prod_unrelated", "prod_essential"],
        PRODUCT_IDS,
      ),
    ).toBe("ESSENTIAL");
  });

  it("returns null when nothing matches, so the caller can fall back", () => {
    expect(resolvePlanFromProductIds([], PRODUCT_IDS)).toBeNull();
    expect(resolvePlanFromProductIds(["prod_other"], PRODUCT_IDS)).toBeNull();
  });
});
