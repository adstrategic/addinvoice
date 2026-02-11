import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import { errorHandler, apiRateLimiter } from "./core/middleware";
import { apiRouter } from "./routes";
import { clerkMiddleware } from "@clerk/express";
import { handleStripeWebhook } from "./features/subscriptions/stripe-webhook.handler";
import { handleClerkWebhook } from "./features/subscriptions/clerk-webhook.handler";
import asyncHandler from "./core/async-handler";

const app = express();
const PORT = process.env.PORT || 4000;

// Global middlewares
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  })
);

app.use(clerkMiddleware());

// ============================================
// PUBLIC WEBHOOK ENDPOINTS (NO AUTH REQUIRED)
// ============================================
// These MUST be registered before express.json() to preserve raw body
// for signature verification

// Stripe webhook - requires raw body for signature verification
app.post(
  "/api/v1/subscription/webhooks/stripe",
  express.raw({ type: "application/json" }),
  asyncHandler(handleStripeWebhook)
);

// Clerk webhook - can use JSON body
app.use(express.json());

app.post(
  "/api/v1/subscription/webhooks/clerk",
  asyncHandler(handleClerkWebhook)
);

// Rate limiting
app.use("/api", apiRateLimiter);

// API routes
app.use("/api/v1", apiRouter);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
