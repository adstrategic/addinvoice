import { stripe, PLAN_PRODUCT_IDS } from "../../core/stripe";
import prisma from "../../core/db";
import type Stripe from "stripe";

export type SubscriptionPlan = "CORE" | "AI_PRO" | "LIFETIME";
export type SubscriptionStatus =
  | "ACTIVE"
  | "CANCELED"
  | "PAST_DUE"
  | "UNPAID"
  | "INCOMPLETE"
  | "INCOMPLETE_EXPIRED"
  | "TRIALING";

export interface SubscriptionStatusResponse {
  isActive: boolean;
  plan: SubscriptionPlan | null;
  status: SubscriptionStatus | null;
}

/**
 * Get subscription status for a workspace
 * Note: This reads from local cache (Workspace table). Stripe is the source of truth.
 */
export async function getSubscriptionStatus(
  workspaceId: number,
): Promise<SubscriptionStatusResponse> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      subscriptionPlan: true,
      subscriptionStatus: true,
    },
  });

  if (
    !workspace ||
    !workspace.subscriptionPlan ||
    !workspace.subscriptionStatus
  ) {
    return {
      isActive: false,
      plan: null,
      status: null,
    };
  }

  const isActive =
    workspace.subscriptionStatus === "ACTIVE" ||
    workspace.subscriptionStatus === "TRIALING";

  return {
    isActive,
    plan: workspace.subscriptionPlan,
    status: workspace.subscriptionStatus,
  };
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
    where: { id: workspaceId },
    select: { stripeCustomerId: true },
  });

  if (workspace?.stripeCustomerId) {
    customerId = workspace.stripeCustomerId;
  } else {
    // Create new Stripe customer
    const customer = await stripe.customers.create({
      email: userEmail,
      metadata: {
        workspaceId: workspaceId.toString(),
        clerkUserId,
      },
    });
    customerId = customer.id;

    // Update workspace with customer ID
    await prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        stripeCustomerId: customerId,
        subscriptionPlan: planType,
        subscriptionStatus: "INCOMPLETE",
      },
    });
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: planType === "LIFETIME" ? "payment" : "subscription",
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${frontendUrl}/subscribe/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${frontendUrl}/subscribe/cancelled`,
    metadata: {
      workspaceId: workspaceId.toString(),
      planType,
      clerkUserId,
    },
  });

  return session.url || "";
}

/**
 * Create Stripe Customer Portal session
 */
export async function createCustomerPortalSession(
  workspaceId: number,
): Promise<string> {
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { stripeCustomerId: true },
  });

  if (!workspace?.stripeCustomerId) {
    throw new Error("No subscription found for this workspace");
  }

  const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

  const session = await stripe.billingPortal.sessions.create({
    customer: workspace.stripeCustomerId,
    return_url: `${frontendUrl}/configuration`,
  });

  return session.url;
}

/**
 * Handle successful checkout completion
 */
export async function handleCheckoutCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  const workspaceId = parseInt(session.metadata?.workspaceId || "0", 10);
  const planType = session.metadata?.planType as SubscriptionPlan;

  if (!workspaceId || !planType) {
    throw new Error("Missing metadata in checkout session");
  }

  // Get subscription from Stripe if it's a subscription (not one-time payment)
  let subscriptionId: string | null = null;
  let status: SubscriptionStatus = "INCOMPLETE";

  if (session.mode === "subscription" && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string,
    );
    subscriptionId = subscription.id;
    status = mapStripeStatusToDbStatus(subscription.status);
  } else if (session.mode === "payment") {
    // For one-time payments (LIFETIME), mark as active immediately
    status = "ACTIVE";
  }

  // Update workspace with subscription info (cache from Stripe)
  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      stripeCustomerId: session.customer as string,
      stripeSubscriptionId: subscriptionId,
      subscriptionPlan: planType,
      subscriptionStatus: status,
    },
  });

  // TODO: AI CREDITS - Purchase AI credits here based on plan
  // CORE: $3 worth of credits
  // AI_PRO: $8 worth of credits
  // LIFETIME: Monthly credit allocation
  // This should be implemented using your AI credits management tool
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
  let planType: SubscriptionPlan | null = null;
  if (subscription.metadata?.planType) {
    planType = subscription.metadata.planType as SubscriptionPlan;
  } else {
    // Fallback: try to determine from price's product ID
    const price = subscription.items.data[0]?.price;
    if (price?.product) {
      const productId =
        typeof price.product === "string" ? price.product : price.product.id;
      if (productId === process.env.STRIPE_PRODUCT_ID_CORE) planType = "CORE";
      else if (productId === process.env.STRIPE_PRODUCT_ID_AI_PRO)
        planType = "AI_PRO";
      else if (productId === process.env.STRIPE_PRODUCT_ID_LIFETIME)
        planType = "LIFETIME";
    }
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionPlan: planType,
      subscriptionStatus: status,
    },
  });

  // TODO: AI CREDITS - Handle subscription renewal
  // When subscription renews (status becomes ACTIVE again), allocate new AI credits
  // CORE: $3 worth of credits
  // AI_PRO: $8 worth of credits
  // LIFETIME: Monthly credit allocation (if applicable)
}

/**
 * Handle subscription deleted event from Stripe
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  let workspaceId = parseInt(subscription.metadata?.workspaceId || "0", 10);

  if (!workspaceId) {
    // Try to find by customer ID
    const existing = await prisma.workspace.findUnique({
      where: { stripeCustomerId: subscription.customer as string },
      select: { id: true },
    });
    if (!existing) {
      return; // Already deleted or doesn't exist
    }
    workspaceId = existing.id;
  }

  await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      subscriptionStatus: "CANCELED",
    },
  });
}

/**
 * Handle subscription updated event from Stripe
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  const workspaceId = parseInt(subscription.metadata?.workspaceId || "0", 10);

  if (!workspaceId) {
    // Try to find by customer ID
    const existing = await prisma.workspace.findUnique({
      where: { stripeCustomerId: subscription.customer as string },
      select: { id: true },
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
    where: { id: workspaceId },
    select: { stripeSubscriptionId: true },
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
    where: { id: workspaceId },
    data: {
      subscriptionStatus: "CANCELED",
    },
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
    past_due: "PAST_DUE",
    unpaid: "UNPAID",
    incomplete: "INCOMPLETE",
    incomplete_expired: "INCOMPLETE_EXPIRED",
    trialing: "TRIALING",
    paused: "CANCELED", // Map paused to canceled for now
  };

  return statusMap[stripeStatus] || "INCOMPLETE";
}

export type PlanPriceInfo = {
  priceId: string;
  amount: number;
  currency: string;
};

export type PlanPricesRecurring = {
  monthly: PlanPriceInfo;
  yearly: PlanPriceInfo;
};

export type PlanPricesLifetime = {
  oneTime: PlanPriceInfo;
};

/**
 * Get available subscription plans with pricing
 * Fetches all active prices per product and groups by recurring interval (month/year)
 */
export async function getAvailablePlans() {
  const [coreProduct, aiProProduct, lifetimeProduct] = await Promise.all([
    stripe.products.retrieve(PLAN_PRODUCT_IDS.CORE),
    stripe.products.retrieve(PLAN_PRODUCT_IDS.AI_PRO),
    stripe.products.retrieve(PLAN_PRODUCT_IDS.LIFETIME),
  ]);

  const buildPricesForProduct = async (
    productId: string,
  ): Promise<PlanPricesRecurring | PlanPricesLifetime> => {
    const { data: prices } = await stripe.prices.list({
      product: productId,
      active: true,
    });

    const monthly = prices.find((p) => p.recurring?.interval === "month");
    const yearly = prices.find((p) => p.recurring?.interval === "year");
    const oneTime = prices.find((p) => !p.recurring);

    if (oneTime && !monthly && !yearly) {
      return {
        oneTime: {
          priceId: oneTime.id,
          amount: (oneTime.unit_amount ?? 0) / 100,
          currency: oneTime.currency.toUpperCase(),
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
        priceId: monthly.id,
        amount: (monthly.unit_amount ?? 0) / 100,
        currency: monthly.currency.toUpperCase(),
      },
      yearly: {
        priceId: yearly.id,
        amount: (yearly.unit_amount ?? 0) / 100,
        currency: yearly.currency.toUpperCase(),
      },
    };
  };

  const [corePrices, aiProPrices, lifetimePrices] = await Promise.all([
    buildPricesForProduct(PLAN_PRODUCT_IDS.CORE),
    buildPricesForProduct(PLAN_PRODUCT_IDS.AI_PRO),
    buildPricesForProduct(PLAN_PRODUCT_IDS.LIFETIME),
  ]);

  return [
    {
      id: "CORE" as const,
      name: coreProduct.name,
      description:
        coreProduct.description ||
        "$12/month, $3 for AI credits" /* fallback */,
      prices: corePrices as PlanPricesRecurring,
    },
    {
      id: "AI_PRO" as const,
      name: aiProProduct.name,
      description:
        aiProProduct.description ||
        "$20/month, $8 for AI credits" /* fallback */,
      prices: aiProPrices as PlanPricesRecurring,
    },
    {
      id: "LIFETIME" as const,
      name: lifetimeProduct.name,
      description:
        lifetimeProduct.description ||
        "$100 one-time payment, free tier AI credits" /* fallback */,
      prices: lifetimePrices as PlanPricesLifetime,
    },
  ];
}
