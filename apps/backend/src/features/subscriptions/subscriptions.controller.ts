import { Response } from "express";
import { getAuth } from "@clerk/express";
import * as subscriptionService from "./subscriptions.service";
import asyncHandler from "../../core/async-handler";
import { Request } from "express";

/**
 * GET /subscription/status - Get current subscription status
 */
export async function getSubscriptionStatus(
  req: Request,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;

  const status = await subscriptionService.getSubscriptionStatus(workspaceId);

  res.json({ data: status });
}

/**
 * POST /subscription/checkout - Create Stripe Checkout session
 */
export async function createCheckout(
  req: Request,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { userId } = getAuth(req);
  const { planType } = req.body;

  if (!planType || !["CORE", "AI_PRO", "LIFETIME"].includes(planType)) {
    res.status(400).json({
      error: "INVALID_PLAN",
      message: "Invalid plan type. Must be CORE, AI_PRO, or LIFETIME",
    });
    return;
  }

  // Get user email from Clerk (you might need to fetch this from Clerk API)
  // For now, we'll use a placeholder - you can enhance this later
  const userEmail = (req as any).auth?.sessionClaims?.email || "";

  const checkoutUrl = await subscriptionService.createCheckoutSession(
    workspaceId,
    planType as "CORE" | "AI_PRO" | "LIFETIME",
    userId!,
    userEmail
  );

  res.json({ data: { url: checkoutUrl } });
}

/**
 * POST /subscription/portal - Create Stripe Customer Portal session
 */
export async function createPortalSession(
  req: Request,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;

  const portalUrl = await subscriptionService.createCustomerPortalSession(
    workspaceId
  );

  res.json({ data: { url: portalUrl } });
}

/**
 * GET /subscription/plans - Get available subscription plans
 */
export async function getPlans(req: Request, res: Response): Promise<void> {
  const plans = await subscriptionService.getAvailablePlans();

  res.json({ data: plans });
}
