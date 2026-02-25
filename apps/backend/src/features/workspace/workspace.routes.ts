import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  listPaymentMethods,
  upsertPaymentMethod,
} from "./workspace.controller.js";
import {
  upsertPaymentMethodParamsSchema,
  upsertPaymentMethodSchema,
} from "./workspace.schemas.js";

/**
 * Workspace routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const workspaceRoutes: Router = Router();

// GET /api/v1/workspace/payment-methods - List all payment methods
workspaceRoutes.get("/payment-methods", asyncHandler(listPaymentMethods));

// PUT /api/v1/workspace/payment-methods/:type - Upsert a payment method
workspaceRoutes.put(
  "/payment-methods/:type",
  processRequest({
    body: upsertPaymentMethodSchema,
    params: upsertPaymentMethodParamsSchema,
  }),
  asyncHandler(upsertPaymentMethod),
);
