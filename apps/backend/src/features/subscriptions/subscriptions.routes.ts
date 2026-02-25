import { Router } from "express";

import asyncHandler from "../../core/async-handler.js";
import {
  createCheckout,
  createPortalSession,
  getPlans,
  getSubscriptionStatus,
} from "./subscriptions.controller.js";

export const subscriptionsRoutes: Router = Router();

// Note: Webhook routes are now registered in server.ts
// They bypass the API router to avoid authentication middleware

// Protected subscription routes - require auth and workspace access
// These are protected by requireAuth() and verifyWorkspaceAccess in routes/index.ts
subscriptionsRoutes.get("/status", asyncHandler(getSubscriptionStatus));
subscriptionsRoutes.post("/checkout", asyncHandler(createCheckout));
subscriptionsRoutes.post("/portal", asyncHandler(createPortalSession));
subscriptionsRoutes.get("/plans", asyncHandler(getPlans));
