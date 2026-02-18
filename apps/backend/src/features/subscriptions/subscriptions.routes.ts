import { Router } from "express";
import {
  getSubscriptionStatus,
  createCheckout,
  createPortalSession,
  getPlans,
} from "./subscriptions.controller";
import asyncHandler from "../../core/async-handler";

export const subscriptionsRoutes = Router();

// Note: Webhook routes are now registered in server.ts
// They bypass the API router to avoid authentication middleware

// Protected subscription routes - require auth and workspace access
// These are protected by requireAuth() and verifyWorkspaceAccess in routes/index.ts
subscriptionsRoutes.get("/status", asyncHandler(getSubscriptionStatus));
subscriptionsRoutes.post("/checkout", asyncHandler(createCheckout));
subscriptionsRoutes.post("/portal", asyncHandler(createPortalSession));
subscriptionsRoutes.get("/plans", asyncHandler(getPlans));
