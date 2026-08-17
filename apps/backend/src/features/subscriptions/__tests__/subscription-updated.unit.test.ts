import type Stripe from "stripe";
import type { Mock } from "vitest";

import { beforeEach, describe, expect, it, vi } from "vitest";

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    referral: { findUnique: vi.fn() },
    workspace: { findUnique: vi.fn(), update: vi.fn() },
    workspaceUsage: { findUnique: vi.fn(), upsert: vi.fn() },
  },
}));

vi.mock("@addinvoice/db", () => ({
  assertCanClaimTrial: vi.fn(),
  MINIMUM_VOICE_MONTHLY_LIMIT: 25,
  MODULE_TRIAL_LIMIT: 4,
  prisma: prismaMock,
  TRIAL_EMAIL_LIMIT: 4,
}));

vi.mock("../../../core/stripe.js", () => ({
  PLAN_PRODUCT_IDS: {
    ESSENTIAL: "prod_essential",
    LIFETIME: "prod_lifetime",
    MINIMUM: "prod_minimum",
  },
  stripe: {},
}));

vi.mock("../../referrals/referrals.service.js", () => ({
  convertReferral: vi.fn(),
  getCheckoutPromotionCode: vi.fn(),
}));

import { handleSubscriptionUpdated } from "../subscriptions.service.js";

const PERIOD_START = Math.floor(
  new Date("2026-08-01T00:00:00.000Z").getTime() / 1000,
);

interface PrismaWriteCall {
  create?: Record<string, unknown>;
  data?: Record<string, unknown>;
  update?: Record<string, unknown>;
  where?: Record<string, unknown>;
}

/** First argument the mock was called with, typed so assertions stay safe. */
function firstCallArg(fn: Mock): PrismaWriteCall {
  const calls = fn.mock.calls as unknown[][];
  const call = calls[0];
  if (!call) throw new Error("expected the mock to have been called");
  return call[0] as PrismaWriteCall;
}

function buildSubscription(
  productId: string,
  overrides: Partial<Stripe.Subscription> = {},
): Stripe.Subscription {
  return {
    current_period_start: PERIOD_START,
    customer: "cus_123",
    id: "sub_123",
    items: { data: [{ price: { product: productId } }] },
    metadata: {},
    status: "active",
    ...overrides,
  } as unknown as Stripe.Subscription;
}

describe("handleSubscriptionUpdated", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.workspace.findUnique.mockResolvedValue({ id: 7 });
    prismaMock.workspace.update.mockResolvedValue({});
    prismaMock.workspaceUsage.upsert.mockResolvedValue({});
    prismaMock.workspaceUsage.findUnique.mockResolvedValue(null);
  });

  it("does not touch voice usage when a window is already anchored", async () => {
    prismaMock.workspaceUsage.findUnique.mockResolvedValue({
      voiceWindowEnd: new Date("2026-09-01T00:00:00.000Z"),
      voiceWindowStart: new Date("2026-08-01T00:00:00.000Z"),
    });

    await handleSubscriptionUpdated(buildSubscription("prod_minimum"));

    // The guard rolls the window at request time; resetting here would hand
    // the user a fresh 25 sessions on any mid-period change.
    expect(prismaMock.workspaceUsage.upsert).not.toHaveBeenCalled();
  });

  it("anchors the window on first sight for MINIMUM", async () => {
    await handleSubscriptionUpdated(buildSubscription("prod_minimum"));

    expect(prismaMock.workspaceUsage.upsert).toHaveBeenCalledTimes(1);
    const call = firstCallArg(prismaMock.workspaceUsage.upsert);
    expect(call.update).toMatchObject({
      voiceItemsCreated: 0,
      voiceWindowEnd: new Date("2026-09-01T00:00:00.000Z"),
      voiceWindowStart: new Date("2026-08-01T00:00:00.000Z"),
    });
  });

  it("writes the resolved plan and status", async () => {
    await handleSubscriptionUpdated(buildSubscription("prod_essential"));

    const { data } = firstCallArg(prismaMock.workspace.update);
    expect(data).toMatchObject({
      subscriptionPlan: "ESSENTIAL",
      subscriptionStatus: "ACTIVE",
    });
  });

  it("maps past_due so the access guard can act on it", async () => {
    await handleSubscriptionUpdated(
      buildSubscription("prod_minimum", {
        status: "past_due",
      } as Partial<Stripe.Subscription>),
    );

    const { data } = firstCallArg(prismaMock.workspace.update);
    expect(data).toMatchObject({ subscriptionStatus: "PAST_DUE" });
  });

  it("leaves the stored plan alone when the product does not resolve", async () => {
    await handleSubscriptionUpdated(buildSubscription("prod_unknown"));

    const { data } = firstCallArg(prismaMock.workspace.update);
    // Writing null would report isActive:false and strand a paying customer.
    expect(data).not.toHaveProperty("subscriptionPlan");
    expect(data).toMatchObject({ subscriptionStatus: "ACTIVE" });
  });

  it("leaves the voice window alone when the plan does not resolve", async () => {
    await handleSubscriptionUpdated(buildSubscription("prod_unknown"));

    // Clearing it would stop rollVoiceWindowIfNeeded ever resetting a MINIMUM
    // user again.
    expect(prismaMock.workspaceUsage.upsert).not.toHaveBeenCalled();
  });

  it("returns quietly for an unknown customer instead of throwing", async () => {
    prismaMock.workspace.findUnique.mockResolvedValue(null);

    // Throwing would 500 and make Stripe retry the event for ~3 days.
    await expect(
      handleSubscriptionUpdated(buildSubscription("prod_minimum")),
    ).resolves.toBeUndefined();
    expect(prismaMock.workspace.update).not.toHaveBeenCalled();
  });

  it("prefers subscription metadata over the customer lookup", async () => {
    await handleSubscriptionUpdated(
      buildSubscription("prod_minimum", {
        metadata: { planType: "ESSENTIAL", workspaceId: "42" },
      } as Partial<Stripe.Subscription>),
    );

    expect(prismaMock.workspace.findUnique).not.toHaveBeenCalled();
    expect(firstCallArg(prismaMock.workspace.update).where).toEqual({ id: 42 });
  });
});
