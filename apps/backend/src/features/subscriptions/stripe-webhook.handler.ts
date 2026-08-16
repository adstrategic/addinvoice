import type { Request, Response } from "express";
import type Stripe from "stripe";

import { stripe } from "../../core/stripe.js";
import * as referralsService from "../referrals/referrals.service.js";
import * as subscriptionService from "./subscriptions.service.js";

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Verify Stripe webhook signature and handle events
 */
export async function handleStripeWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    res.status(400).json({ error: "Missing stripe-signature header" });
    return;
  }

  let event: Stripe.Event;

  if (!WEBHOOK_SECRET) {
    throw new Error(
      "STRIPE_WEBHOOK_SECRET is not set in environment variables",
    );
  }

  try {
    // Verify webhook signature
    // req.body is a Buffer when using express.raw()
    const body =
      req.body instanceof Buffer
        ? req.body
        : Buffer.from(JSON.stringify(req.body));
    event = stripe.webhooks.constructEvent(body, sig, WEBHOOK_SECRET);
  } catch (err: unknown) {
    console.error(
      "Webhook signature verification failed:",
      err instanceof Error ? err.message : err,
    );
    res.status(400).json({
      error: `Webhook Error: ${String(err instanceof Error ? err.message : err)}`,
    });
    return;
  }

  // Log the event for debugging
  console.log(`Received Stripe webhook: ${event.type}`);

  try {
    // Handle different event types
    switch (event.type) {
      case "charge.dispute.created":
        await handleDisputeCreated(event.data.object);
        break;

      case "charge.refunded":
        await handleChargeRefunded(event.data.object);
        break;

      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      // Referral commission accrues here rather than on checkout completion,
      // so it follows money actually collected — renewals included, unpaid
      // invoices excluded.
      case "invoice.paid":
        await referralsService.accrueCommissionForInvoice(event.data.object);
        break;

      // case "invoice.payment_succeeded":
      //   await handleInvoicePaymentSucceeded(
      //     event.data.object as Stripe.Invoice
      //   );
      //   break;

      // case "invoice.payment_failed":
      //   await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice);
      //   break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    // Note: Audit trail is available in Stripe Dashboard
    // No need to log transactions locally - Stripe is the source of truth

    res.json({ received: true });
  } catch (error: unknown) {
    console.error("Error processing webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Handle checkout session completed
 */
async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session,
): Promise<void> {
  await subscriptionService.handleCheckoutCompleted(session);
}

/**
 * Handle a refund by reversing the commission it invalidates.
 *
 * amount_refunded is cumulative across partial refunds, so passing it straight
 * through lets the ledger converge on the correct total no matter how many
 * refund events arrive.
 */
async function handleChargeRefunded(charge: Stripe.Charge): Promise<void> {
  await referralsService.reverseCommissionForCharge(
    charge.id,
    charge.amount_refunded,
  );
}

/**
 * Handle a dispute by reversing the full commission for the charge. Treated as
 * a total loss: even if the dispute is later won, the money was not ours to
 * pay out in the meantime.
 */
async function handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
  const chargeId =
    typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;

  await referralsService.reverseCommissionForCharge(
    chargeId,
    Number.MAX_SAFE_INTEGER,
  );
}

/**
 * Handle failed invoice payment
 */
// async function handleInvoicePaymentFailed(
//   invoice: Stripe.Invoice,
// ): Promise<void> {
//   if (!invoice.subscription) {
//     return; // Not a subscription invoice
//   }

//   const subscription = await stripe.subscriptions.retrieve(
//     invoice.subscription as string,
//   );

//   // Update subscription status to reflect payment failure
//   await subscriptionService.handleSubscriptionUpdated(subscription);
// }

/**
 * Handle successful invoice payment
 */
// async function handleInvoicePaymentSucceeded(
//   invoice: Stripe.Invoice,
// ): Promise<void> {
//   if (!invoice.subscription) {
//     return; // Not a subscription invoice
//   }

//   const subscription = await stripe.subscriptions.retrieve(
//     invoice.subscription as string,
//   );
//   await subscriptionService.handleSubscriptionUpdated(subscription);

//   // TODO: AI CREDITS - Handle subscription renewal
//   // When invoice payment succeeds, allocate new AI credits for the period
//   // MINIMUM: $3 worth of credits
//   // ESSENTIAL: $8 worth of credits
//   // LIFETIME: Monthly credit allocation (if applicable)
// }

/**
 * Handle subscription created
 */
// async function handleSubscriptionCreated(
//   subscription: Stripe.Subscription,
// ): Promise<void> {
//   await subscriptionService.handleSubscriptionUpdated(subscription);
// }

/**
 * Handle subscription deleted
 */
async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription,
): Promise<void> {
  await subscriptionService.handleSubscriptionDeleted(subscription);
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription,
): Promise<void> {
  await subscriptionService.handleSubscriptionUpdated(subscription);
}
