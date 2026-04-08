import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  completeOnboarding,
  getWorkspaceLanguage,
  getOnboarding,
  listPaymentMethods,
  upsertPaymentMethod,
  updateWorkspaceLanguage,
} from "./workspace.controller.js";
import {
  upsertOnboardingSchema,
  upsertPaymentMethodParamsSchema,
  upsertPaymentMethodSchema,
  upsertWorkspaceLanguageSchema,
} from "./workspace.schemas.js";

/**
 * Workspace routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const workspaceRoutes: Router = Router();

// Onboarding routes
workspaceRoutes.get("/onboarding", asyncHandler(getOnboarding));
workspaceRoutes.post(
  "/onboarding",
  processRequest({
    body: upsertOnboardingSchema,
  }),
  asyncHandler(completeOnboarding),
);

// GET /api/v1/workspace/payment-methods - List all payment methods
workspaceRoutes.get("/payment-methods", asyncHandler(listPaymentMethods));

// GET /api/v1/workspace/language - current voice agent language
workspaceRoutes.get("/language", asyncHandler(getWorkspaceLanguage));

// PUT /api/v1/workspace/language - update voice agent language
workspaceRoutes.put(
  "/language",
  processRequest({
    body: upsertWorkspaceLanguageSchema,
  }),
  asyncHandler(updateWorkspaceLanguage),
);

// PUT /api/v1/workspace/payment-methods/:type - Upsert a payment method
workspaceRoutes.put(
  "/payment-methods/:type",
  processRequest({
    body: upsertPaymentMethodSchema,
    params: upsertPaymentMethodParamsSchema,
  }),
  asyncHandler(upsertPaymentMethod),
);
