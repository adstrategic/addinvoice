import { PaymentMethodType, prisma } from "@addinvoice/db";

import type { InvoiceEntityWithRelations } from "./invoices.schemas.js";

import {
  createCheckoutSession,
  createPerWorkspaceStripeClient,
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
  const paymentLink = await createCheckoutSession(
    stripeClient,
    invoice,
    successUrl,
    cancelUrl,
  );

  await prisma.invoice.update({
    data: { paymentLink, paymentProvider: "stripe" },
    where: { id: invoice.id },
  });

  return paymentLink;
}
