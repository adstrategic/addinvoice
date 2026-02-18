import { Router } from "express";
import { processRequest } from "zod-express-middleware";
import {
  listPaymentMethods,
  upsertPaymentMethod,
} from "./workspace.controller";
import {
  upsertPaymentMethodSchema,
  upsertPaymentMethodParamsSchema,
} from "./workspace.schemas";
import asyncHandler from "../../core/async-handler";

/**
 * Workspace routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const workspaceRoutes = Router();

// GET /api/v1/workspace/payment-methods - List all payment methods
workspaceRoutes.get("/payment-methods", asyncHandler(listPaymentMethods));

// PUT /api/v1/workspace/payment-methods/:type - Upsert a payment method
workspaceRoutes.put(
  "/payment-methods/:type",
  processRequest({
    params: upsertPaymentMethodParamsSchema,
    body: upsertPaymentMethodSchema,
  }),
  asyncHandler(upsertPaymentMethod),
);
