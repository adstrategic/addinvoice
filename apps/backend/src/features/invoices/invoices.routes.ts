import { bulkLinkAdvancesToInvoiceBodySchema } from "@addinvoice/schemas";
import { Router } from "express";
import multer from "multer";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  createPaymentSchema,
  updatePaymentSchema,
} from "../payments/payments.schemas.js";
import {
  addInvoiceItem,
  addPayment,
  bulkLinkAdvancesToInvoice,
  createInvoice,
  createInvoiceFromVoiceAudio,
  createInvoiceFromVoiceTranscript,
  deleteInvoice,
  deleteInvoiceItem,
  deletePayment,
  enqueueSendInvoice,
  getInvoiceBySequence,
  getInvoicePdf,
  getNextInvoiceNumber,
  getPendingAdvancesForInvoice,
  listInvoices,
  sendInvoice,
  updateInvoice,
  updateInvoiceItem,
  updatePayment,
} from "./invoices.controller.js";
import {
  createInvoiceItemSchema,
  createInvoiceSchema,
  fromVoiceTranscriptBodySchema,
  getInvoiceByIdSchema,
  getInvoiceBySequenceSchema,
  getInvoiceItemByIdSchema,
  getNextInvoiceNumberQuerySchema,
  getPaymentByIdSchema,
  listInvoicesSchema,
  sendInvoiceBodySchema,
  updateInvoiceItemSchema,
  updateInvoiceSchema,
} from "./invoices.schemas.js";

/**
 * Invoices routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const invoicesRoutes: Router = Router();

const audioUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (_req, file, cb) => {
    const base = file.mimetype.split(";")[0]?.trim() ?? "";
    cb(null, base.startsWith("audio/"));
  },
});

// POST /api/v1/invoices/from-voice-audio — audio blob → Whisper → Claude → draft invoice
invoicesRoutes.post(
  "/from-voice-audio",
  audioUpload.single("audio") as never,
  asyncHandler(createInvoiceFromVoiceAudio),
);

// GET /api/v1/invoices/next-number - Get next suggested invoice number
invoicesRoutes.get(
  "/next-number",
  processRequest({ query: getNextInvoiceNumberQuerySchema }),
  asyncHandler(getNextInvoiceNumber),
);

// GET /api/v1/invoices - List all invoices
invoicesRoutes.get(
  "/",
  processRequest({ query: listInvoicesSchema }),
  asyncHandler(listInvoices),
);

// GET /api/v1/invoices/:sequence/pdf - Get invoice as PDF (must be before /:sequence)
invoicesRoutes.get(
  "/:sequence/pdf",
  processRequest({ params: getInvoiceBySequenceSchema }),
  asyncHandler(getInvoicePdf),
);

// POST /api/v1/invoices/:sequence/send - Enqueue send invoice email (202)
invoicesRoutes.post(
  "/:sequence/send",
  processRequest({
    body: sendInvoiceBodySchema,
    params: getInvoiceBySequenceSchema,
  }),
  asyncHandler(enqueueSendInvoice),
);

// GET /api/v1/invoices/:id - Get invoice by ID
invoicesRoutes.get(
  "/:sequence",
  processRequest({ params: getInvoiceBySequenceSchema }),
  asyncHandler(getInvoiceBySequence),
);

// POST /api/v1/invoices - Create a new invoice
invoicesRoutes.post(
  "/",
  processRequest({ body: createInvoiceSchema }),
  asyncHandler(createInvoice),
);

// POST /api/v1/invoices/from-voice-transcript — transcript + Claude → draft invoice
invoicesRoutes.post(
  "/from-voice-transcript",
  processRequest({ body: fromVoiceTranscriptBodySchema }),
  asyncHandler(createInvoiceFromVoiceTranscript),
);

// PATCH /api/v1/invoices/:sequence/send - Mark invoice as sent
// Must be before /:invoiceId to avoid route conflicts
invoicesRoutes.patch(
  "/:invoiceId/send",
  processRequest({ params: getInvoiceByIdSchema }),
  asyncHandler(sendInvoice),
);

// GET /api/v1/invoices/:invoiceId/pending-advances - Client-only pending advances
invoicesRoutes.get(
  "/:invoiceId/pending-advances",
  processRequest({ params: getInvoiceByIdSchema }),
  asyncHandler(getPendingAdvancesForInvoice),
);

// POST /api/v1/invoices/:invoiceId/link-advances - Bulk link advances to invoice
invoicesRoutes.post(
  "/:invoiceId/link-advances",
  processRequest({
    body: bulkLinkAdvancesToInvoiceBodySchema,
    params: getInvoiceByIdSchema,
  }),
  asyncHandler(bulkLinkAdvancesToInvoice),
);

// PATCH /api/v1/invoices/:id - Update an invoice
invoicesRoutes.patch(
  "/:invoiceId",
  processRequest({
    body: updateInvoiceSchema,
    params: getInvoiceByIdSchema,
  }),
  asyncHandler(updateInvoice),
);

// DELETE /api/v1/invoices/:id - Delete an invoice (soft delete)
invoicesRoutes.delete(
  "/:invoiceId",
  processRequest({ params: getInvoiceByIdSchema }),
  asyncHandler(deleteInvoice),
);

// POST /api/v1/invoices/:invoiceId/items - Add an invoice item
invoicesRoutes.post(
  "/:invoiceId/items",
  processRequest({
    body: createInvoiceItemSchema,
    params: getInvoiceByIdSchema,
  }),
  asyncHandler(addInvoiceItem),
);

// PATCH /api/v1/invoices/:invoiceId/items/:itemId - Update an invoice item
invoicesRoutes.patch(
  "/:invoiceId/items/:itemId",
  processRequest({
    body: updateInvoiceItemSchema,
    params: getInvoiceItemByIdSchema,
  }),
  asyncHandler(updateInvoiceItem),
);

// DELETE /api/v1/invoices/:invoiceId/items/:itemId - Delete an invoice item
invoicesRoutes.delete(
  "/:invoiceId/items/:itemId",
  processRequest({ params: getInvoiceItemByIdSchema }),
  asyncHandler(deleteInvoiceItem),
);

// POST /api/v1/invoices/:invoiceId/payments - Add a payment
invoicesRoutes.post(
  "/:invoiceId/payments",
  processRequest({
    body: createPaymentSchema,
    params: getInvoiceByIdSchema,
  }),
  asyncHandler(addPayment),
);

// PATCH /api/v1/invoices/:invoiceId/payments/:paymentId - Update a payment
invoicesRoutes.patch(
  "/:invoiceId/payments/:paymentId",
  processRequest({
    body: updatePaymentSchema,
    params: getPaymentByIdSchema,
  }),
  asyncHandler(updatePayment),
);

// DELETE /api/v1/invoices/:invoiceId/payments/:paymentId - Delete a payment (soft delete)
invoicesRoutes.delete(
  "/:invoiceId/payments/:paymentId",
  processRequest({ params: getPaymentByIdSchema }),
  asyncHandler(deletePayment),
);
