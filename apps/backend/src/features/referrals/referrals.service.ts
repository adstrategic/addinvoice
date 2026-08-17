import type Stripe from "stripe";

import { Prisma, prisma } from "@addinvoice/db";

import { PLAN_PRODUCT_IDS } from "../../core/stripe.js";
import {
  ConflictError,
  EntityNotFoundError,
  EntityValidationError,
} from "../../errors/EntityErrors.js";
import {
  addMonths,
  calculateCommissionCents,
  getAvailableAt,
  getCommissionBaseCents,
  isDiscountEligible,
  isReferralEligiblePlan,
  isWithinCommissionWindow,
  REFERRAL_DISCOUNT_PCT,
  resolvePlanFromProductIds,
} from "./referrals.policy.js";

export interface ReferralSummary {
  code: string;
  discountPct: number;
  referrerName: string;
  status: "CONVERTED" | "PENDING";
}

/**
 * Look up a code for the public landing route. Returns null rather than
 * throwing: an unknown code must never be distinguishable from a paused one,
 * and must never block the signup it precedes.
 */
export async function findActiveReferrerByCode(code: string) {
  return prisma.referrer.findFirst({
    where: { code, status: "ACTIVE" },
  });
}

/**
 * The referral attached to a workspace, if any, shaped for the UI.
 */
export async function getReferralForWorkspace(
  workspaceId: number,
): Promise<null | ReferralSummary> {
  const referral = await prisma.referral.findUnique({
    include: { referrer: true },
    where: { workspaceId },
  });

  if (!referral) return null;

  return {
    code: referral.referrer.code,
    discountPct: REFERRAL_DISCOUNT_PCT,
    referrerName: referral.referrer.name,
    status: referral.status,
  };
}

/**
 * Attach a referral code to a workspace.
 *
 * Attribution is soft until money changes hands: a PENDING referral can be
 * replaced freely, but a CONVERTED one is frozen forever. Without that freeze a
 * customer could switch referrers months later and the ledger would stop
 * reconciling with what was already paid out.
 */
export async function attachReferral(
  workspaceId: number,
  code: string,
  userEmail: string,
): Promise<ReferralSummary> {
  const referrer = await findActiveReferrerByCode(code);

  if (!referrer) {
    throw new EntityNotFoundError("That referral code is not valid");
  }

  // Self-referral would hand someone 20% off plus 20% back on their own
  // account. Email is the only identity the referrer and the workspace share.
  const normalisedUserEmail = userEmail.trim().toLowerCase();

  if (normalisedUserEmail && referrer.email.toLowerCase() === normalisedUserEmail) {
    throw new EntityValidationError("You cannot use your own referral code");
  }

  const existing = await prisma.referral.findUnique({
    where: { workspaceId },
  });

  if (existing?.status === "CONVERTED") {
    throw new ConflictError(
      "This account already has a referral applied and cannot be changed",
    );
  }

  await prisma.referral.upsert({
    create: {
      attributedAt: new Date(),
      referrerId: referrer.id,
      status: "PENDING",
      workspaceId,
    },
    update: {
      attributedAt: new Date(),
      referrerId: referrer.id,
    },
    where: { workspaceId },
  });

  return {
    code: referrer.code,
    discountPct: REFERRAL_DISCOUNT_PCT,
    referrerName: referrer.name,
    status: "PENDING",
  };
}

/**
 * Drop a not-yet-converted referral. Since Stripe's promo code input is
 * disabled on checkout, this is the customer's only way out of a stale or
 * wrong referral cookie.
 */
export async function detachReferral(workspaceId: number): Promise<void> {
  const existing = await prisma.referral.findUnique({ where: { workspaceId } });

  if (!existing) return;

  if (existing.status === "CONVERTED") {
    throw new ConflictError(
      "This referral has already been applied and cannot be removed",
    );
  }

  await prisma.referral.delete({ where: { workspaceId } });
}

/**
 * The Stripe promotion code to pre-apply at checkout, or null.
 *
 * Never throws: a paused referrer or a promotion code that has gone missing in
 * Stripe results in no discount and a log line. Losing a discount is
 * recoverable; failing the checkout loses the sale.
 */
export async function getCheckoutPromotionCode(
  workspaceId: number,
  plan: string,
  priceInterval: null | string | undefined,
): Promise<null | { code: string; promotionCodeId: string }> {
  if (!isDiscountEligible(plan, priceInterval)) return null;

  try {
    const referral = await prisma.referral.findUnique({
      include: { referrer: true },
      where: { workspaceId },
    });

    if (referral?.status !== "PENDING") return null;
    if (referral.referrer.status !== "ACTIVE") return null;

    return {
      code: referral.referrer.code,
      promotionCodeId: referral.referrer.stripePromotionCodeId,
    };
  } catch (error) {
    console.error("Failed to resolve referral promotion code:", error);
    return null;
  }
}

/**
 * Freeze attribution and start the commission clock. Idempotent: a referral
 * that is already CONVERTED is left untouched.
 */
export async function convertReferral(
  workspaceId: number,
  plan: null | string,
): Promise<void> {
  if (!isReferralEligiblePlan(plan)) return;

  const referral = await prisma.referral.findUnique({
    include: { referrer: true },
    where: { workspaceId },
  });

  if (!referral || referral.status === "CONVERTED") return;

  const convertedAt = new Date();

  await prisma.referral.update({
    data: {
      commissionEndsAt: addMonths(
        convertedAt,
        referral.referrer.commissionMonths,
      ),
      commissionRatePct: referral.referrer.commissionRatePct,
      convertedAt,
      status: "CONVERTED",
    },
    where: { id: referral.id },
  });
}

/**
 * Write one commission row for a paid invoice.
 *
 * Safe to call for every invoice.paid event: it returns early for unreferred
 * workspaces, ineligible plans, zero-value invoices and expired windows, and
 * the unique constraint on stripeInvoiceId absorbs webhook redelivery.
 */
export async function accrueCommissionForInvoice(
  invoice: Stripe.Invoice,
): Promise<void> {
  if (invoice.amount_paid <= 0) return;

  const customerId =
    typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id;

  if (!customerId) return;

  const workspace = await prisma.workspace.findUnique({
    select: { id: true, subscriptionPlan: true },
    where: { stripeCustomerId: customerId },
  });

  if (!workspace) return;

  // Read the plan off the invoice rather than the workspace cache: on a first
  // purchase, invoice.paid can arrive before checkout.session.completed has
  // written subscriptionPlan, and trusting the cache would silently drop the
  // first commission. The cache is only a fallback.
  const plan =
    resolvePlanFromProductIds(
      invoice.lines.data.map((line) => {
        const product = line.price?.product;
        return typeof product === "string" ? product : product?.id;
      }),
      PLAN_PRODUCT_IDS,
    ) ?? workspace.subscriptionPlan;

  if (!isReferralEligiblePlan(plan)) return;

  // Same ordering concern: conversion is attempted here rather than assumed to
  // have already happened in the checkout handler.
  await convertReferral(workspace.id, plan);

  const referral = await prisma.referral.findUnique({
    include: { referrer: true },
    where: { workspaceId: workspace.id },
  });

  if (referral?.status !== "CONVERTED") return;

  const paidAt = invoice.status_transitions.paid_at
    ? new Date(invoice.status_transitions.paid_at * 1000)
    : new Date();

  if (!isWithinCommissionWindow(paidAt, referral.commissionEndsAt)) return;

  const baseAmountCents = getCommissionBaseCents(invoice);
  const ratePct = Number(
    referral.commissionRatePct ?? referral.referrer.commissionRatePct,
  );
  const amountCents = calculateCommissionCents(baseAmountCents, ratePct);

  if (amountCents <= 0) return;

  const chargeId =
    typeof invoice.charge === "string" ? invoice.charge : invoice.charge?.id;

  try {
    await prisma.referralCommission.create({
      data: {
        amountCents,
        availableAt: getAvailableAt(),
        baseAmountCents,
        currency: invoice.currency.toUpperCase(),
        referralId: referral.id,
        referrerId: referral.referrerId,
        status: "PENDING",
        stripeChargeId: chargeId ?? null,
        stripeInvoiceId: invoice.id,
      },
    });
  } catch (error) {
    const isDuplicate =
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002";

    // Stripe redelivered an event we already recorded. Nothing to do.
    if (!isDuplicate) throw error;
  }
}

/**
 * Reverse commission after a refund or dispute.
 *
 * Reversals are inserted as negative rows rather than edits, so the ledger
 * stays append-only. Idempotency comes from reconciling against how much has
 * already been reversed for this charge and writing only the difference —
 * repeated or partial refunds converge on the right total.
 */
export async function reverseCommissionForCharge(
  chargeId: string,
  amountRefundedCents: number,
): Promise<void> {
  if (amountRefundedCents <= 0) return;

  const rows = await prisma.referralCommission.findMany({
    where: { stripeChargeId: chargeId },
  });

  const accrual = rows.find((row) => row.amountCents > 0);
  if (!accrual) return;

  const alreadyReversedCents = rows
    .filter((row) => row.amountCents < 0)
    .reduce((sum, row) => sum + Math.abs(row.amountCents), 0);

  // Refunds are proportional to the commission base, not to the gross charge,
  // so a tax-inclusive refund does not over-reverse.
  const refundRatio = Math.min(
    1,
    accrual.baseAmountCents > 0
      ? amountRefundedCents / accrual.baseAmountCents
      : 1,
  );
  const targetReversalCents = Math.round(accrual.amountCents * refundRatio);
  const deltaCents = targetReversalCents - alreadyReversedCents;

  if (deltaCents <= 0) return;

  await prisma.$transaction([
    prisma.referralCommission.create({
      data: {
        amountCents: -deltaCents,
        availableAt: new Date(),
        baseAmountCents: 0,
        currency: accrual.currency,
        referralId: accrual.referralId,
        referrerId: accrual.referrerId,
        status: "REVERSED",
        stripeChargeId: chargeId,
        stripeInvoiceId: null,
      },
    }),
    prisma.referralCommission.update({
      data: {
        status:
          targetReversalCents >= accrual.amountCents ? "REVERSED" : accrual.status,
      },
      where: { id: accrual.id },
    }),
  ]);
}

/**
 * Move commissions out of the hold window. Called before reading admin totals
 * so "owed" is always current without needing a scheduled job.
 */
export async function approveMaturedCommissions(): Promise<void> {
  await prisma.referralCommission.updateMany({
    data: { status: "APPROVED" },
    where: {
      availableAt: { lte: new Date() },
      status: "PENDING",
    },
  });
}

export interface ReferrerTotals {
  approvedCents: number;
  currency: string;
  paidCents: number;
  pendingCents: number;
}

/**
 * Per-referrer totals, grouped by currency. Amounts in different currencies are
 * never summed — a mixed total would be a meaningless number to pay out on.
 */
function summariseByCurrency(
  rows: { amountCents: number; currency: string; status: string }[],
): ReferrerTotals[] {
  const byCurrency = new Map<string, ReferrerTotals>();

  for (const row of rows) {
    const totals = byCurrency.get(row.currency) ?? {
      approvedCents: 0,
      currency: row.currency,
      paidCents: 0,
      pendingCents: 0,
    };

    if (row.status === "PENDING") totals.pendingCents += row.amountCents;
    if (row.status === "APPROVED") totals.approvedCents += row.amountCents;
    if (row.status === "PAID") totals.paidCents += row.amountCents;
    // REVERSED rows are negative and reduce whichever bucket they offset.
    if (row.status === "REVERSED" && row.amountCents < 0) {
      totals.approvedCents += row.amountCents;
    }

    byCurrency.set(row.currency, totals);
  }

  return [...byCurrency.values()];
}

/**
 * Admin listing: every referrer with their referral counts and money totals.
 */
export async function listReferrersWithTotals() {
  await approveMaturedCommissions();

  const referrers = await prisma.referrer.findMany({
    include: {
      commissions: {
        select: { amountCents: true, currency: true, status: true },
      },
      referrals: { select: { status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return referrers.map((referrer) => ({
    code: referrer.code,
    commissionMonths: referrer.commissionMonths,
    commissionRatePct: Number(referrer.commissionRatePct),
    convertedCount: referrer.referrals.filter(
      (referral) => referral.status === "CONVERTED",
    ).length,
    email: referrer.email,
    id: referrer.id,
    name: referrer.name,
    referralCount: referrer.referrals.length,
    status: referrer.status,
    totals: summariseByCurrency(referrer.commissions),
  }));
}

/**
 * Admin detail: one referrer, their referrals and their full ledger.
 */
export async function getReferrerDetail(referrerId: number) {
  await approveMaturedCommissions();

  const referrer = await prisma.referrer.findUnique({
    include: {
      commissions: {
        orderBy: { createdAt: "desc" },
        take: 200,
      },
      payouts: { orderBy: { paidAt: "desc" } },
      referrals: {
        include: {
          workspace: { select: { id: true, name: true } },
        },
        orderBy: { attributedAt: "desc" },
      },
    },
    where: { id: referrerId },
  });

  if (!referrer) {
    throw new EntityNotFoundError("Referrer not found");
  }

  return {
    code: referrer.code,
    commissionMonths: referrer.commissionMonths,
    commissionRatePct: Number(referrer.commissionRatePct),
    commissions: referrer.commissions.map((commission) => ({
      amountCents: commission.amountCents,
      availableAt: commission.availableAt,
      baseAmountCents: commission.baseAmountCents,
      createdAt: commission.createdAt,
      currency: commission.currency,
      id: commission.id,
      status: commission.status,
      stripeInvoiceId: commission.stripeInvoiceId,
    })),
    email: referrer.email,
    id: referrer.id,
    name: referrer.name,
    payouts: referrer.payouts,
    referrals: referrer.referrals.map((referral) => ({
      attributedAt: referral.attributedAt,
      commissionEndsAt: referral.commissionEndsAt,
      convertedAt: referral.convertedAt,
      id: referral.id,
      status: referral.status,
      workspaceName: referral.workspace.name,
    })),
    status: referrer.status,
    totals: summariseByCurrency(referrer.commissions),
  };
}
