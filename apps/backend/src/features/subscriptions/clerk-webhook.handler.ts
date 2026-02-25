import type { Request, Response } from "express";

import { prisma } from "@addinvoice/db";
import { Webhook } from "svix";

import * as subscriptionService from "./subscriptions.service.js";

const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

/** Clerk webhook payload shape (user.* events) */
interface ClerkWebhookPayload {
  data: { id: string };
  type: string;
}

/**
 * Handle Clerk webhook events
 * Verifies webhook signature using Svix and processes events
 */
export async function handleClerkWebhook(
  req: Request,
  res: Response,
): Promise<void> {
  const svixId = req.headers["svix-id"] as string;
  const svixTimestamp = req.headers["svix-timestamp"] as string;
  const svixSignature = req.headers["svix-signature"] as string;

  if (!svixId || !svixTimestamp || !svixSignature) {
    res.status(400).json({ error: "Missing Svix headers" });
    return;
  }

  if (!WEBHOOK_SECRET) {
    throw new Error("CLERK_WEBHOOK_SECRET is not set in environment variables");
  }

  // Verify webhook signature using Svix
  const wh = new Webhook(WEBHOOK_SECRET);
  let payload: ClerkWebhookPayload;

  try {
    payload = wh.verify(JSON.stringify(req.body), {
      "svix-id": svixId,
      "svix-signature": svixSignature,
      "svix-timestamp": svixTimestamp,
    }) as ClerkWebhookPayload;
  } catch (err) {
    console.error(
      "Webhook signature verification failed:",
      err instanceof Error ? err.message : err,
    );
    res.status(400).json({
      error: `Webhook Error: ${err instanceof Error ? err.message : String(err)}`,
    });
    return;
  }

  const eventType = payload.type;
  console.log(`Received Clerk webhook: ${eventType}`);

  try {
    switch (eventType) {
      case "user.created":
        // Optional: Log user creation for debugging
        console.log(`User created: ${payload.data.id}`);
        break;

      case "user.deleted":
        await handleUserDeleted(payload.data);
        break;

      case "user.updated":
        // Optional: Log user updates for debugging
        console.log(`User updated: ${payload.data.id}`);
        break;

      default:
        console.log(`Unhandled Clerk event type: ${eventType}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error("Error processing Clerk webhook:", error);
    res.status(500).json({ error: "Webhook processing failed" });
  }
}

/**
 * Handle user deleted event - revoke subscription
 */
async function handleUserDeleted(data: { id: string }): Promise<void> {
  const clerkUserId = data.id;

  // Find workspace by Clerk user ID
  const workspace = await prisma.workspace.findUnique({
    where: { clerkId: clerkUserId },
  });

  if (!workspace) {
    console.log(`No workspace found for deleted user: ${clerkUserId}`);
    return;
  }

  // Revoke subscription in Stripe and update database
  await subscriptionService.revokeSubscription(workspace.id);
  console.log(`✅ Subscription revoked for workspace: ${String(workspace.id)}`);
}
