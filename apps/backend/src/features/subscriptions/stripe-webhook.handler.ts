import type { Request, Response } from "express";
import type Stripe from "stripe";

import { stripe } from "../../core/stripe.js";
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
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      // case "customer.subscription.created":
      //   await handleSubscriptionCreated(
      //     event.data.object as Stripe.Subscription,
      //   );
      //   break;

      // case "customer.subscription.updated":
      //   await handleSubscriptionUpdated(
      //     event.data.object as Stripe.Subscription,
      //   );
      //   break;

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
//   // CORE: $3 worth of credits
//   // AI_PRO: $8 worth of credits
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
// async function handleSubscriptionUpdated(
//   subscription: Stripe.Subscription,
// ): Promise<void> {
//   await subscriptionService.handleSubscriptionUpdated(subscription);
// }
