import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  enqueueSendReceipt,
  getPaymentById,
  getReceiptPdf,
  listPayments,
} from "./payments.controller.js";
import {
  getPaymentByIdSchema,
  listPaymentsSchema,
  sendReceiptBodySchema,
} from "./payments.schemas.js";

/**
 * Payments routes (read-only)
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const paymentsRoutes: Router = Router();

// GET /api/v1/payments - List payments for workspace
paymentsRoutes.get(
  "/",
  processRequest({ query: listPaymentsSchema }),
  asyncHandler(listPayments),
);

// GET /api/v1/payments/:id - Get payment by ID
paymentsRoutes.get(
  "/:id",
  processRequest({ params: getPaymentByIdSchema }),
  asyncHandler(getPaymentById),
);

// GET /api/v1/payments/:id/receipt - Get receipt PDF (must be before /:id)
paymentsRoutes.get(
  "/:id/receipt",
  processRequest({ params: getPaymentByIdSchema }),
  asyncHandler(getReceiptPdf),
);

// POST /api/v1/payments/:id/send-receipt - Enqueue send receipt email (202)
paymentsRoutes.post(
  "/:id/send-receipt",
  processRequest({
    body: sendReceiptBodySchema,
    params: getPaymentByIdSchema,
  }),
  asyncHandler(enqueueSendReceipt),
);
