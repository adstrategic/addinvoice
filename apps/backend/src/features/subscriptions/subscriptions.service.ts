import type Stripe from "stripe";

import {
  assertCanClaimTrial,
  MINIMUM_VOICE_MONTHLY_LIMIT,
  MODULE_TRIAL_LIMIT,
  prisma,
  TRIAL_EMAIL_LIMIT,
} from "@addinvoice/db";

import { PLAN_PRODUCT_IDS, stripe } from "../../core/stripe.js";

export interface PlanPriceInfo {
  amount: number;
  currency: string;
  priceId: string;
}
export interface PlanPricesLifetime {
  oneTime: PlanPriceInfo;
}

export interface PlanPricesRecurring {
  monthly: PlanPriceInfo;
  yearly: PlanPriceInfo;
}

export type PaidSubscriptionPlan = "ESSENTIAL" | "LIFETIME" | "MINIMUM";
export type SubscriptionPlan = "FREE_TRIAL" | PaidSubscriptionPlan;

export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "PAST_DUE"
  | "TRIALING"
  | "UNPAID";

export interface TrialUsageSummary {
  advances: { limit: number; used: number };
  catalog: { limit: number; used: number };
  clients: { limit: number; used: number };
  emails: { limit: number; used: number };
  estimates: { limit: number; used: number };
  expenses: { limit: number; used: number };
  invoices: { limit: number; used: number };
  payments: { limit: number; used: number };
  proposals: { limit: number; used: number };
}

export interface VoiceUsageSummary {
  limit: number;
  used: number;
  windowEnd: null | string;
}

export interface SubscriptionStatusResponse {
  hasEverPaid: boolean;
  isActive: boolean;
  plan: null | SubscriptionPlan;
  status: null | SubscriptionStatus;
  trialUsage?: TrialUsageSummary;
  voiceUsage?: VoiceUsageSummary;
}

/**
 * Create a Stripe Checkout session for subscription
 */
export async function createCheckoutSession(
  workspaceId: number,
  planType: SubscriptionPlan,
  priceId: string,
  clerkUserId: string,
  userEmail: string,
): Promise<string> {
  // Get or create Stripe customer
  let customerId: string;
  const workspace = await prisma.workspace.findUnique({
    select: { stripeCustomerId: true },
    where: { id: workspaceId },
  });

  if (workspace?.stripeCustomerId) {
    customerId = workspace.stripeCustomerId;
  } else {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        clerkUserId,
        workspaceId: workspaceId.toString(),
      },
    });
    customerId = customer.id;

    // Update workspace with customer ID
    await prisma.workspace.update({
      data: {
        stripeCustomerId: customerId,
        subscriptionPlan: planType,
        subscriptionStatus: "INCOMPLETE",
      },
      where: { id: workspaceId },
    });
  }

  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not set in environment variables");
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    cancel_url: `${frontendUrl}/subscribe/cancelled`,
    customer: customerId,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      clerkUserId,
      planType,
      workspaceId: workspaceId.toString(),
    },
    mode: planType === "LIFETIME" ? "payment" : "subscription",
    success_url: `${frontendUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
  });

  return session.url ?? "";
}

/**
 * Create Stripe Customer Portal session
 */
export async function createCustomerPortalSession(
  workspaceId: number,
  returnPath = "/configuration",
): Promise<string> {
  const workspace = await prisma.workspace.findUnique({
    select: { stripeCustomerId: true },
    where: { id: workspaceId },
  });

  if (!workspace?.stripeCustomerId) {
    throw new Error("No subscription found for this workspace");
  }

  const frontendUrl = process.env.FRONTEND_URL;

  if (!frontendUrl) {
    throw new Error("FRONTEND_URL is not set in environment variables");
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${frontendUrl}${returnPath}`,
  });

  return session.url;
}

/**
 * Get available subscription plans with pricing
 * Fetches all active prices per product and groups by recurring interval (month/year)
 */
export async function getAvailablePlans() {
  const [minimumProduct, essentialProduct, lifetimeProduct] = await Promise.all(
    [
      stripe.products.retrieve(PLAN_PRODUCT_IDS.MINIMUM),
      stripe.products.retrieve(PLAN_PRODUCT_IDS.ESSENTIAL),
      stripe.products.retrieve(PLAN_PRODUCT_IDS.LIFETIME),
    ],
  );

  const buildPricesForProduct = async (
    productId: string,
  ): Promise<PlanPricesLifetime | PlanPricesRecurring> => {
    const { data: prices } = await stripe.prices.list({
      active: true,
      product: productId,
    });

    const monthly = prices.find((p) => p.recurring?.interval === "month");
    const yearly = prices.find((p) => p.recurring?.interval === "year");
    const oneTime = prices.find((p) => !p.recurring);

    if (oneTime && !monthly && !yearly) {
      return {
        oneTime: {
          amount: (oneTime.unit_amount ?? 0) / 100,
          currency: oneTime.currency.toUpperCase(),
          priceId: oneTime.id,
        },
      };
    }

    if (!monthly || !yearly) {
      throw new Error(
        `Product ${productId} must have both monthly and yearly active prices`,
      );
    }

    return {
      monthly: {
        amount: (monthly.unit_amount ?? 0) / 100,
        currency: monthly.currency.toUpperCase(),
        priceId: monthly.id,
      },
      yearly: {
        amount: (yearly.unit_amount ?? 0) / 100,
        currency: yearly.currency.toUpperCase(),
        priceId: yearly.id,
      },
    };
  };

  const [minimumPrices, essentialPrices, lifetimePrices] = await Promise.all([
    buildPricesForProduct(PLAN_PRODUCT_IDS.MINIMUM),
    buildPricesForProduct(PLAN_PRODUCT_IDS.ESSENTIAL),
    buildPricesForProduct(PLAN_PRODUCT_IDS.LIFETIME),
  ]);

  return [
    {
      description:
        minimumProduct.description ??
        "Manual & voice invoicing (25 voice sessions/month)" /* fallback */,
      id: "MINIMUM" as const,
      name: minimumProduct.name,
      prices: minimumPrices as PlanPricesRecurring,
    },
    {
      description:
        essentialProduct.description ??
        "Unlimited voice + AI bookkeeper assistant" /* fallback */,
      id: "ESSENTIAL" as const,
      name: essentialProduct.name,
      prices: essentialPrices as PlanPricesRecurring,
    },
    {
      description:
        lifetimeProduct.description ??
        "One-time payment, lifetime access" /* fallback */,
      id: "LIFETIME" as const,
      name: lifetimeProduct.name,
      prices: lifetimePrices as PlanPricesLifetime,
    },
  ];
}

/**
 * Get subscription status for a workspace
 * Note: This reads from local cache (Workspace table). Stripe is the source of truth.
 */
export async function getSubscriptionStatus(
  workspaceId: number,
): Promise<SubscriptionStatusResponse> {
  const workspace = await prisma.workspace.findUnique({
    select: {
      hasEverPaid: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
      usage: true,
    },
    where: { id: workspaceId },
  });

  if (!workspace) {
    return {
      hasEverPaid: false,
      isActive: false,
      plan: null,
      status: null,
    };
  }

  if (!workspace.subscriptionPlan || !workspace.subscriptionStatus) {
    return {
      hasEverPaid: workspace.hasEverPaid,
      isActive: false,
      plan: null,
      status: null,
    };
  }

  const isActive =
    workspace.subscriptionStatus === "ACTIVE" ||
    workspace.subscriptionStatus === "TRIALING";

  const response: SubscriptionStatusResponse = {
    hasEverPaid: workspace.hasEverPaid,
    isActive,
    plan: workspace.subscriptionPlan,
    status: workspace.subscriptionStatus,
  };

  const usage = workspace.usage;
  if (workspace.subscriptionPlan === "FREE_TRIAL" && usage) {
    response.trialUsage = {
      invoices: { used: usage.invoicesCreated, limit: MODULE_TRIAL_LIMIT },
      estimates: { used: usage.estimatesCreated, limit: MODULE_TRIAL_LIMIT },
      proposals: { used: usage.proposalsCreated, limit: MODULE_TRIAL_LIMIT },
      expenses: { used: usage.expensesCreated, limit: MODULE_TRIAL_LIMIT },
      advances: { used: usage.advancesCreated, limit: MODULE_TRIAL_LIMIT },
      catalog: { used: usage.catalogCreated, limit: MODULE_TRIAL_LIMIT },
      clients: { used: usage.clientsCreated, limit: MODULE_TRIAL_LIMIT },
      payments: { used: usage.paymentsCreated, limit: MODULE_TRIAL_LIMIT },
      emails: { used: usage.emailsSent, limit: TRIAL_EMAIL_LIMIT },
    };
  }
  if (workspace.subscriptionPlan === "MINIMUM" && usage) {
    response.voiceUsage = {
      limit: MINIMUM_VOICE_MONTHLY_LIMIT,
      used: usage.voiceItemsCreated,
      windowEnd: usage.voiceWindowEnd
        ? usage.voiceWindowEnd.toISOString()
        : null,
    };
  }

  return response;
}

/**
 * Activate the free trial for a workspace.
 * Caller must have an authenticated workspace; guard rejects if hasEverPaid
 * or already on FREE_TRIAL.
 */
export async function activateTrial(workspaceId: number): Promise<void> {
  await assertCanClaimTrial(prisma, workspaceId);
  await prisma.$transaction([
    prisma.workspace.update({
      data: {
        subscriptionPlan: "FREE_TRIAL",
        subscriptionStatus: "ACTIVE",
      },
      where: { id: workspaceId },
    }),
    prisma.workspaceUsage.upsert({
      create: { workspaceId },
      update: {},
      where: { workspaceId },
    }),
  ]);
}

/**
 * Handle successful checkout completion
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const workspaceId = parseInt(session.metadata?.workspaceId ?? "0", 10);
  const planType = session.metadata?.planType as
    | PaidSubscriptionPlan
    | undefined;

  if (!workspaceId || !planType) {
    throw new Error("Missing metadata in checkout session");
  }

  // Get subscription from Stripe if it's a subscription (not one-time payment)
  let subscriptionId: null | string = null;
  let status: SubscriptionStatus = "INCOMPLETE";
  let voiceWindowStart: Date | null = null;

  if (session.mode === "subscription" && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );
    subscriptionId = subscription.id;
    status = mapStripeStatusToDbStatus(subscription.status);
    voiceWindowStart = new Date(subscription.current_period_start * 1000);
  } else if (session.mode === "payment") {
    // For one-time payments (LIFETIME), mark as active immediately
    status = "ACTIVE";
  }

  // Update workspace with subscription info (cache from Stripe) and flip
  // hasEverPaid so the free trial cannot be re-claimed later.
  await prisma.workspace.update({
    data: {
      hasEverPaid: true,
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      subscriptionPlan: planType,
      subscriptionStatus: status,
    },
    where: { id: workspaceId },
  });

  await syncVoiceWindow(workspaceId, planType, voiceWindowStart);

  // TODO: AI CREDITS - Purchase AI credits here based on plan
  // MINIMUM: $3 worth of credits
  // ESSENTIAL: $8 worth of credits
  // LIFETIME: Monthly credit allocation
  // This should be implemented using your AI credits management tool
}

/**
 * Handle subscription deleted event from Stripe
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  let workspaceId = parseInt(subscription.metadata.workspaceId ?? "0", 10);

  if (!workspaceId) {
    // Try to find by customer ID
    const existing = await prisma.workspace.findUnique({
      select: { id: true },
      where: { stripeCustomerId: subscription.customer as string },
    });
    if (!existing) {
      return; // Already deleted or doesn't exist
    }
    workspaceId = existing.id;
  }

  await prisma.workspace.update({
    data: {
      subscriptionStatus: "CANCELED",
    },
    where: { id: workspaceId },
  });
}

/**
 * Handle subscription updated event from Stripe
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const workspaceId = parseInt(subscription.metadata.workspaceId ?? "0", 10);

  if (!workspaceId) {
    // Try to find by customer ID
    const existing = await prisma.workspace.findUnique({
      select: { id: true },
      where: { stripeCustomerId: subscription.customer as string },
    });
    if (!existing) {
      throw new Error("Workspace not found for this subscription");
    }
    // Update using existing workspaceId
    await updateSubscriptionFromStripe(existing.id, subscription);
    return;
  }

  await updateSubscriptionFromStripe(workspaceId, subscription);
}

/**
 * Revoke subscription when Clerk user is deleted
 */
export async function revokeSubscription(workspaceId: number): Promise<void> {
  const workspace = await prisma.workspace.findUnique({
    select: { stripeSubscriptionId: true },
    where: { id: workspaceId },
  });

  if (!workspace?.stripeSubscriptionId) {
    // No active subscription to cancel
    return;
  }

  try {
    // Cancel the subscription in Stripe (source of truth)
    await stripe.subscriptions.cancel(workspace.stripeSubscriptionId);
  } catch (error) {
    console.error("Error canceling Stripe subscription:", error);
    // Continue to mark as canceled in DB even if Stripe call fails
  }

  // Update local cache
  await prisma.workspace.update({
    data: {
      subscriptionStatus: "CANCELED",
    },
    where: { id: workspaceId },
  });
}

/**
 * Map Stripe subscription status to database status
 */
function mapStripeStatusToDbStatus(
  stripeStatus: Stripe.Subscription.Status,
): SubscriptionStatus {
  const statusMap: Record<Stripe.Subscription.Status, SubscriptionStatus> = {
    active: "ACTIVE",
    canceled: "CANCELED",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    past_due: "PAST_DUE",
    paused: "CANCELED", // Map paused to canceled for now
    trialing: "TRIALING",
    unpaid: "UNPAID",
  };

  return statusMap[stripeStatus];
}

/**
 * Update subscription record from Stripe subscription object
 */
async function updateSubscriptionFromStripe(
  workspaceId: number,
  subscription: Stripe.Subscription,
): Promise<void> {
  const status = mapStripeStatusToDbStatus(subscription.status);

  // Extract plan type from subscription metadata or price
  let planType: null | PaidSubscriptionPlan = null;
  if (subscription.metadata.planType) {
    planType = subscription.metadata.planType as PaidSubscriptionPlan;
  } else {
    // Fallback: try to determine from price's product ID
    const price = subscription.items.data[0]?.price;
    if (price?.product) {
      const productId =
        typeof price.product === "string" ? price.product : price.product.id;
      if (productId === process.env.STRIPE_PRODUCT_ID_MINIMUM)
        planType = "MINIMUM";
      else if (productId === process.env.STRIPE_PRODUCT_ID_ESSENTIAL)
        planType = "ESSENTIAL";
      else if (productId === process.env.STRIPE_PRODUCT_ID_LIFETIME)
        planType = "LIFETIME";
    }
  }

  await prisma.workspace.update({
    data: {
      hasEverPaid: true,
      stripeSubscriptionId: subscription.id,
      subscriptionPlan: planType,
      subscriptionStatus: status,
    },
    where: { id: workspaceId },
  });

  const voiceWindowStart = new Date(subscription.current_period_start * 1000);
  await syncVoiceWindow(workspaceId, planType, voiceWindowStart);

  // TODO: AI CREDITS - Handle subscription renewal
  // When subscription renews (status becomes ACTIVE again), allocate new AI credits
  // MINIMUM: $3 worth of credits
  // ESSENTIAL: $8 worth of credits
  // LIFETIME: Monthly credit allocation (if applicable)
}

/**
 * Initialize or clear the voice usage window depending on plan.
 * For MINIMUM, anchors the first window to the Stripe period start (always one
 * month long, regardless of monthly vs. yearly billing). For other plans, the
 * window is cleared so it doesn't leak into MINIMUM voice counting later.
 */
async function syncVoiceWindow(
  workspaceId: number,
  plan: null | PaidSubscriptionPlan,
  voiceWindowStart: Date | null,
): Promise<void> {
  if (plan === "MINIMUM" && voiceWindowStart) {
    const voiceWindowEnd = new Date(voiceWindowStart);
    voiceWindowEnd.setUTCMonth(voiceWindowEnd.getUTCMonth() + 1);

    await prisma.workspaceUsage.upsert({
      create: {
        voiceItemsCreated: 0,
        voiceWindowEnd,
        voiceWindowStart,
        workspaceId,
      },
      update: {
        voiceItemsCreated: 0,
        voiceWindowEnd,
        voiceWindowStart,
      },
      where: { workspaceId },
    });
    return;
  }

  // Non-MINIMUM plans: keep counters but clear the voice window so it isn't
  // mistakenly reused if the user later downgrades to MINIMUM.
  await prisma.workspaceUsage.upsert({
    create: { workspaceId },
    update: {
      voiceItemsCreated: 0,
      voiceWindowEnd: null,
      voiceWindowStart: null,
    },
    where: { workspaceId },
  });
}
