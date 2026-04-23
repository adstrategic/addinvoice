import type { Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { constructEvent, handleSubscriptionUpdatedMock } = vi.hoisted(() => ({
  constructEvent: vi.fn(),
  handleSubscriptionUpdatedMock: vi.fn(),
}));

vi.mock("../../../core/stripe.js", () => ({
  stripe: {
    webhooks: {
      constructEvent,
    },
  },
}));

vi.mock("../subscriptions.service.js", () => ({
  handleCheckoutCompleted: vi.fn(),
  handleSubscriptionDeleted: vi.fn(),
  handleSubscriptionUpdated: handleSubscriptionUpdatedMock,
}));

import { handleStripeWebhook } from "../stripe-webhook.handler.js";

describe("stripe-webhook.handler", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
  });

  it("handles customer.subscription.updated events", async () => {
    const subscriptionObject = {
      customer: "cus_123",
      id: "sub_123",
      items: { data: [] },
      metadata: { workspaceId: "1" },
      status: "active",
    };

    constructEvent.mockReturnValue({
      data: { object: subscriptionObject },
      type: "customer.subscription.updated",
    });

    const req = {
      body: Buffer.from("test"),
      headers: {
        "stripe-signature": "sig_test",
      },
    } as Request;

    const json = vi.fn();
    const status = vi.fn().mockReturnValue({ json });
    const res = { json, status } as unknown as Response;

    await handleStripeWebhook(req, res);

    expect(handleSubscriptionUpdatedMock).toHaveBeenCalledWith(subscriptionObject);
    expect(json).toHaveBeenCalledWith({ received: true });
  });
});
