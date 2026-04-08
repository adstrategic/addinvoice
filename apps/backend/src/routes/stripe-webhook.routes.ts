import express, { Router, type Request, type Response } from "express";
import Stripe from "stripe";
import { PaymentMethodType, prisma } from "@addinvoice/db";
import asyncHandler from "../core/async-handler.js";
import { decrypt } from "../core/encryption.js";
import { stripe } from "../core/stripe.js";

export const stripePaymentWebhookRouter: Router = Router();

/**
 * POST /api/v1/stripe/webhook/:workspaceId
 *
 * Public endpoint — no Clerk auth. Security is provided entirely by Stripe
 * signature verification using the per-workspace webhook signing secret.
 *
 * Must be registered BEFORE express.json() in server.ts so that req.body
 * is the raw Buffer required for signature verification.
 */
stripePaymentWebhookRouter.post(
  "/stripe/webhook/:workspaceId",
  // Raw body is required for Stripe signature verification — must run before express.json()
  express.raw({ type: "application/json" }),
  asyncHandler(async (req: Request, res: Response) => {
    const workspaceId = Number(req.params.workspaceId);
    if (!workspaceId || isNaN(workspaceId)) {
      res.status(400).send("Invalid workspace ID");
      return;
    }

    const sig = req.headers["stripe-signature"];
    if (!sig || typeof sig !== "string") {
      res.status(400).send("Missing stripe-signature header");
      return;
    }

    // Load the per-workspace webhook signing secret
    const pm = await prisma.workspacePaymentMethod.findFirst({
      where: { type: PaymentMethodType.STRIPE, workspaceId },
    });

    if (!pm?.stripeWebhookSecret) {
      res.status(400).send("Stripe not configured for this workspace");
      return;
    }

    const webhookSecret = decrypt(pm.stripeWebhookSecret);

    // Verify the webhook signature — throws if invalid or body was modified
    let event: Stripe.Event;
    try {
      // stripe.webhooks.constructEvent is a utility that doesn't call Stripe's API —
      // it just verifies the HMAC signature locally using the signing secret
      event = stripe.webhooks.constructEvent(
        req.body as Buffer,
        sig,
        webhookSecret,
      );
    } catch {
      res.status(400).send("Webhook signature verification failed");
      return;
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const invoiceId = Number(session.metadata?.invoiceId);

      // Unknown invoice in metadata — ack to stop Stripe retrying
      if (!invoiceId || isNaN(invoiceId)) {
        res.status(200).send("ok");
        return;
      }

      const invoice = await prisma.invoice.findFirst({
        where: { id: invoiceId, workspaceId },
      });

      // Idempotent — already paid or doesn't belong to this workspace
      if (!invoice || invoice.status === "PAID") {
        res.status(200).send("ok");
        return;
      }

      const amountPaid = (session.amount_total ?? 0) / 100;

      await prisma.$transaction([
        prisma.invoice.update({
          data: { balance: 0, paidAt: new Date(), status: "PAID" },
          where: { id: invoiceId },
        }),
        prisma.payment.create({
          data: {
            amount: amountPaid,
            details: `Stripe Checkout Session ${session.id}`,
            invoiceId,
            paidAt: new Date(),
            paymentMethod: "stripe",
            transactionId: session.id,
            workspaceId,
          },
        }),
      ]);
    }

    // Always return 200 — Stripe retries on non-2xx responses
    res.status(200).send("ok");
  }),
);
