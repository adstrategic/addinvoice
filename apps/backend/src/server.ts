import "dotenv/config";
import { clerkMiddleware } from "@clerk/express";
import cors from "cors";
import express from "express";
import helmet from "helmet";

import asyncHandler from "./core/async-handler.js";
import { apiRateLimiter, errorHandler } from "./core/middleware.js";
import { estimatesPublicRoutes } from "./features/estimates/estimates-public.routes.js";
import { handleClerkWebhook } from "./features/subscriptions/clerk-webhook.handler.js";
import { handleStripeWebhook } from "./features/subscriptions/stripe-webhook.handler.js";
import { apiRouter } from "./routes/index.js";
import { stripePaymentWebhookRouter } from "./routes/stripe-webhook.routes.js";

const app = express();

// Trust the first proxy (Railway) so X-Forwarded-For is used for IP / rate limiting
app.set("trust proxy", 1);

const PORT = process.env.PORT ?? 4000;

// Global middlewares
app.use(helmet());
app.use(
  cors({
    credentials: true,
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
  }),
);

app.use(clerkMiddleware());

// ============================================
// PUBLIC WEBHOOK ENDPOINTS (NO AUTH REQUIRED)
// ============================================
// These MUST be registered before express.json() to preserve raw body
// for signature verification

// Stripe subscription webhook - requires raw body for signature verification
app.post(
  "/api/v1/subscription/webhooks/stripe",
  express.raw({ type: "application/json" }),
  asyncHandler(handleStripeWebhook),
);

// Stripe per-workspace payment webhook router — express.raw() is applied inside
// the router route itself, so it only affects the webhook path
app.use("/api/v1", stripePaymentWebhookRouter);

// Clerk webhook - can use JSON body
app.use(express.json());

app.post(
  "/api/v1/subscription/webhooks/clerk",
  asyncHandler(handleClerkWebhook),
);

// Rate limiting
app.use("/api", apiRateLimiter);

// Public API routes (no auth) - must be before main apiRouter
app.use("/api/v1/public", estimatesPublicRoutes);

// API routes (auth required)
app.use("/api/v1", apiRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${String(PORT)}`);
});
