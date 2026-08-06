import Stripe from "stripe";

import type { InvoiceEntityWithRelations } from "../invoices/invoices.schemas.js";

import { decrypt } from "../../core/encryption.js";
import { plainTextFromTipTapJson } from "../../lib/tiptap.js";

const STRIPE_API_VERSION = "2025-02-24.acacia" as const;

/**
 * Creates a per-workspace Stripe client by decrypting the stored encrypted key.
 */
export function createPerWorkspaceStripeClient(encryptedKey: string): Stripe {
  const secretKey = decrypt(encryptedKey);
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  });
}

/**
 * Validates a Stripe secret key and auto-registers a webhook endpoint on the
 * user's Stripe account pointing to our per-workspace webhook URL.
 *
 * Returns { webhookId, webhookSecret } on success.
 * Returns { webhookId: null, webhookSecret: null } if webhook registration fails
 * due to insufficient key permissions — caller should surface manual setup instructions.
 */
export async function validateAndRegisterWebhook(
  secretKey: string,
  workspaceId: number,
  appBaseUrl: string,
): Promise<{ webhookId: null | string; webhookSecret: null | string }> {
  const stripeClient = new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
  });

  // Validates the key — throws Stripe.errors.StripeAuthenticationError if invalid
  await stripeClient.accounts.retrieve();

  const webhookUrl = `${appBaseUrl.replace(/\/$/, "")}/api/v1/stripe/webhook/${workspaceId}`;

  try {
    const endpoint = await stripeClient.webhookEndpoints.create({
      enabled_events: ["checkout.session.completed"],
      url: webhookUrl,
    });
    return { webhookId: endpoint.id, webhookSecret: endpoint.secret ?? null };
  } catch (err) {
    // Key is valid but lacks webhook:write permissions — degrade gracefully
    console.warn(
      `[stripe] Could not auto-register webhook for workspace ${workspaceId}:`,
      err instanceof Error ? err.message : err,
    );
    return { webhookId: null, webhookSecret: null };
  }
}

/**
 * Builds the itemized Stripe line items for the full invoice amount:
 * per-item line items plus a BY_TOTAL tax line item. Invoice-level discounts
 * are returned separately as Stripe Coupons (created lazily).
 */
async function buildFullAmountLineItems(
  stripeClient: Stripe,
  invoice: InvoiceEntityWithRelations,
  currency: string,
): Promise<{
  discounts: Stripe.Checkout.SessionCreateParams["discounts"];
  lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
}> {
  const items = invoice.items ?? [];

  // Build line items — use the pre-calculated item.total to avoid re-implementing
  // discount and tax logic. Each line item shows the post-discount (item-level) amount.
  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map(
    (item) => {
      const itemTotal = Number(item.total);
      const quantity = Number(item.quantity);
      // unit_amount must be a non-negative integer in the smallest currency unit (cents)
      const unitAmount = Math.round((itemTotal / quantity) * 100);
      const descriptionPlain = plainTextFromTipTapJson(item.description).trim();
      const descriptionText =
        descriptionPlain.length > 0 ? descriptionPlain : undefined;
      return {
        price_data: {
          currency,
          product_data: {
            description: descriptionText,
            name: item.name,
          },
          unit_amount: Math.max(0, unitAmount),
        },
        quantity,
      };
    },
  );

  // For BY_TOTAL tax mode, add a dedicated tax line item
  if (invoice.taxMode === "BY_TOTAL" && Number(invoice.totalTax) > 0) {
    lineItems.push({
      price_data: {
        currency,
        product_data: {
          name: invoice.taxName ?? "Tax",
        },
        unit_amount: Math.round(Number(invoice.totalTax) * 100),
      },
      quantity: 1,
    });
  }

  // For invoice-level discounts, create a Stripe Coupon and attach it to the session
  let discounts: Stripe.Checkout.SessionCreateParams["discounts"] = undefined;
  if (invoice.discountType !== "NONE" && Number(invoice.discount) > 0) {
    const couponParams: Stripe.CouponCreateParams =
      invoice.discountType === "PERCENTAGE"
        ? { duration: "once", percent_off: Number(invoice.discount) }
        : {
            amount_off: Math.round(Number(invoice.discount) * 100),
            currency,
            duration: "once",
          };
    const coupon = await stripeClient.coupons.create(couponParams);
    discounts = [{ coupon: coupon.id }];
  }

  return { discounts, lineItems };
}

/**
 * Creates a Stripe Checkout Session for an invoice.
 *
 * When the invoice has recorded partial payments (balance < total), the session
 * charges only the remaining balance via a single "Balance due" line item — the
 * balance already nets out tax and discounts. Otherwise line items are itemized
 * from invoice.items with a BY_TOTAL tax line item and invoice-level discounts.
 *
 * Returns the hosted checkout session's id and URL.
 */
export async function createCheckoutSession(
  stripeClient: Stripe,
  invoice: InvoiceEntityWithRelations,
  successUrl: string,
  cancelUrl: string,
): Promise<{ id: string; url: string }> {
  const currency = invoice.currency.toLowerCase();
  const items = invoice.items ?? [];

  if (items.length === 0) {
    throw new Error(
      "Cannot create a Stripe Checkout Session for an invoice with no items",
    );
  }

  const total = Number(invoice.total);
  const balance = Number(invoice.balance);
  const hasPartialPayment = balance > 0 && balance < total;

  let lineItems: Stripe.Checkout.SessionCreateParams.LineItem[];
  let discounts: Stripe.Checkout.SessionCreateParams["discounts"];

  if (hasPartialPayment) {
    // Charge only the outstanding balance — it already accounts for tax and discounts.
    lineItems = [
      {
        price_data: {
          currency,
          product_data: {
            description: `Remaining balance for invoice ${invoice.invoiceNumber}`,
            name: "Balance due",
          },
          unit_amount: Math.max(0, Math.round(balance * 100)),
        },
        quantity: 1,
      },
    ];
    discounts = undefined;
  } else {
    ({ discounts, lineItems } = await buildFullAmountLineItems(
      stripeClient,
      invoice,
      currency,
    ));
  }

  const session = await stripeClient.checkout.sessions.create({
    cancel_url: cancelUrl,
    discounts,
    line_items: lineItems,
    metadata: {
      invoiceId: String(invoice.id),
      workspaceId: String(invoice.workspaceId),
    },
    mode: "payment",
    success_url: successUrl,
  });

  if (!session.url) {
    throw new Error("Stripe did not return a checkout URL");
  }

  return { id: session.id, url: session.url };
}

/**
 * Expires an open Stripe Checkout Session so its hosted URL can no longer be paid.
 * Silently ignores sessions that are already completed/expired (Stripe throws).
 */
export async function expireCheckoutSession(
  stripeClient: Stripe,
  sessionId: string,
): Promise<void> {
  try {
    await stripeClient.checkout.sessions.expire(sessionId);
  } catch (err) {
    console.warn(
      `[stripe] Could not expire checkout session ${sessionId}:`,
      err instanceof Error ? err.message : err,
    );
  }
}

/**
 * Deletes a webhook endpoint from the user's Stripe account.
 * Silently ignores 404 (already deleted or never existed).
 */
export async function deregisterWebhook(
  stripeClient: Stripe,
  webhookId: string,
): Promise<void> {
  try {
    await stripeClient.webhookEndpoints.del(webhookId);
  } catch (err) {
    if (err instanceof Stripe.errors.StripeError && err.statusCode === 404)
      return;
    throw err;
  }
}
