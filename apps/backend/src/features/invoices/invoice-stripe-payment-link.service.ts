import { PaymentMethodType, prisma } from "@addinvoice/db";

import type { InvoiceEntityWithRelations } from "./invoices.schemas.js";

import {
  createCheckoutSession,
  createPerWorkspaceStripeClient,
  expireCheckoutSession,
} from "../stripe/stripe-integration.service.js";

function getFrontendBaseUrl(): string {
  return process.env.FRONTEND_URL?.trim() ?? "http://localhost:3000";
}

export function buildInvoiceStripeCheckoutUrls(invoice: {
  publicSlug: null | string;
  sequence: number;
}): { cancelUrl: string; successUrl: string } {
  const frontendUrl = getFrontendBaseUrl();

  if (invoice.publicSlug) {
    const publicPath = `${frontendUrl}/public/${invoice.publicSlug}`;
    return {
      successUrl: `${publicPath}?paid=true`,
      cancelUrl: publicPath,
    };
  }

  const invoicePath = `${frontendUrl}/invoices/${invoice.sequence}`;
  return {
    successUrl: `${invoicePath}?paid=true`,
    cancelUrl: invoicePath,
  };
}

/**
 * Ensures a Stripe Checkout URL exists when the invoice uses Stripe and the
 * workspace has Stripe configured. Idempotent when paymentLink is already set.
 */
export async function ensureInvoiceStripePaymentLink(
  workspaceId: number,
  invoice: InvoiceEntityWithRelations,
): Promise<null | string> {
  if (invoice.paymentLink) {
    return invoice.paymentLink;
  }

  if (invoice.selectedPaymentMethod?.type !== "STRIPE") {
    return null;
  }

  const workspaceStripe = await prisma.workspacePaymentMethod.findFirst({
    where: { type: PaymentMethodType.STRIPE, workspaceId },
  });

  if (!workspaceStripe?.stripeSecretKey) {
    return null;
  }

  const { successUrl, cancelUrl } = buildInvoiceStripeCheckoutUrls(invoice);
  const stripeClient = createPerWorkspaceStripeClient(
    workspaceStripe.stripeSecretKey,
  );
  const { id: sessionId, url: paymentLink } = await createCheckoutSession(
    stripeClient,
    invoice,
    successUrl,
    cancelUrl,
  );

  await prisma.invoice.update({
    data: {
      paymentLink,
      paymentProvider: "stripe",
      paymentSessionId: sessionId,
    },
    where: { id: invoice.id },
  });

  return paymentLink;
}

/**
 * Expires the invoice's cached Stripe Checkout Session (best-effort) and clears
 * the stored link fields, so the public page stops offering Stripe and the old
 * hosted URL can no longer be paid. No-op when the invoice has no stored link.
 */
export async function expireInvoiceStripeSession(
  workspaceId: number,
  invoice: InvoiceEntityWithRelations,
): Promise<void> {
  if (!invoice.paymentLink && !invoice.paymentSessionId) {
    return;
  }

  if (invoice.paymentSessionId) {
    const workspaceStripe = await prisma.workspacePaymentMethod.findFirst({
      where: { type: PaymentMethodType.STRIPE, workspaceId },
    });

    if (workspaceStripe?.stripeSecretKey) {
      const stripeClient = createPerWorkspaceStripeClient(
        workspaceStripe.stripeSecretKey,
      );
      await expireCheckoutSession(stripeClient, invoice.paymentSessionId);
    }
  }

  await prisma.invoice.update({
    data: {
      paymentLink: null,
      paymentProvider: null,
      paymentSessionId: null,
    },
    where: { id: invoice.id },
  });
}
