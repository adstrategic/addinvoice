import type { Request, Response } from "express";

import { getAuth } from "@clerk/express";

import { getWorkspaceId } from "../../core/auth.js";
import * as subscriptionService from "./subscriptions.service.js";

const VALID_PLAN_TYPES = ["AI_PRO", "CORE", "LIFETIME"] as const;
type PlanType = (typeof VALID_PLAN_TYPES)[number];

/**
 * POST /subscription/checkout - Create Stripe Checkout session
 */
export async function createCheckout(
  req: Request,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const auth = getAuth(req);
  const userId = auth.userId;

  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const body = req.body as { planType?: unknown; priceId?: unknown };
  const { planType, priceId } = body;

  if (
    !planType ||
    typeof planType !== "string" ||
    !VALID_PLAN_TYPES.includes(planType as PlanType)
  ) {
    res.status(400).json({
      error: "INVALID_PLAN",
      message: "Invalid plan type. Must be CORE, AI_PRO, or LIFETIME",
    });
    return;
  }

  if (
    !priceId ||
    typeof priceId !== "string" ||
    !priceId.startsWith("price_")
  ) {
    res.status(400).json({
      error: "INVALID_PRICE_ID",
      message: "priceId must be a valid Stripe price ID (starts with price_)",
    });
    return;
  }

  const sessionClaims = auth.sessionClaims as undefined | { email?: string };
  const userEmail = sessionClaims?.email ?? "";

  const checkoutUrl = await subscriptionService.createCheckoutSession(
    workspaceId,
    planType as PlanType,
    priceId,
    userId,
    userEmail,
  );

  res.json({ data: { url: checkoutUrl } });
}

/**
 * POST /subscription/portal - Create Stripe Customer Portal session
 */
export async function createPortalSession(
  req: Request,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);

  const portalUrl =
    await subscriptionService.createCustomerPortalSession(workspaceId);

  res.json({ data: { url: portalUrl } });
}

/**
 * GET /subscription/plans - Get available subscription plans
 */
export async function getPlans(req: Request, res: Response): Promise<void> {
  const plans = await subscriptionService.getAvailablePlans();

  res.json({ data: plans });
}

/**
 * GET /subscription/status - Get current subscription status
 */
export async function getSubscriptionStatus(
  req: Request,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);

  const status = await subscriptionService.getSubscriptionStatus(workspaceId);

  res.json({ data: status });
}
