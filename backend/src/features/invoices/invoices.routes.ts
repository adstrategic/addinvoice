import { Router } from "express";
import { processRequest } from "zod-express-middleware";
import {
  listInvoices,
  getNextInvoiceNumber,
  getInvoiceBySequence,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  markInvoiceAsPaid,
  addInvoiceItem,
  updateInvoiceItem,
  deleteInvoiceItem,
  addPayment,
  updatePayment,
  deletePayment,
} from "./invoices.controller";
import {
  listInvoicesSchema,
  getInvoiceBySequenceSchema,
  getInvoiceByIdSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  createInvoiceItemSchema,
  updateInvoiceItemSchema,
  getInvoiceItemByIdSchema,
  createPaymentSchema,
  updatePaymentSchema,
  getPaymentByIdSchema,
} from "./invoices.schemas";
import asyncHandler from "../../core/async-handler";

/**
 * Invoices routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const invoicesRoutes = Router();

// GET /api/v1/invoices/next-number - Get next suggested invoice number
invoicesRoutes.get("/next-number", asyncHandler(getNextInvoiceNumber));

// GET /api/v1/invoices - List all invoices
invoicesRoutes.get(
  "/",
  processRequest({ query: listInvoicesSchema }),
  asyncHandler(listInvoices)
);

// GET /api/v1/invoices/:id - Get invoice by ID
invoicesRoutes.get(
  "/:sequence",
  processRequest({ params: getInvoiceBySequenceSchema }),
  asyncHandler(getInvoiceBySequence)
);

// POST /api/v1/invoices - Create a new invoice
invoicesRoutes.post(
  "/",
  processRequest({ body: createInvoiceSchema }),
  asyncHandler(createInvoice)
);

// PATCH /api/v1/invoices/:sequence/send - Mark invoice as sent
// Must be before /:invoiceId to avoid route conflicts
invoicesRoutes.patch(
  "/:invoiceId/send",
  processRequest({ params: getInvoiceByIdSchema }),
  asyncHandler(sendInvoice)
);

// PATCH /api/v1/invoices/:invoiceId/mark-as-paid - Mark invoice as paid
// Must be before /:invoiceId to avoid route conflicts
invoicesRoutes.patch(
  "/:invoiceId/mark-as-paid",
  processRequest({ params: getInvoiceByIdSchema }),
  asyncHandler(markInvoiceAsPaid)
);

// PATCH /api/v1/invoices/:id - Update an invoice
invoicesRoutes.patch(
  "/:invoiceId",
  processRequest({
    params: getInvoiceByIdSchema,
    body: updateInvoiceSchema,
  }),
  asyncHandler(updateInvoice)
);

// DELETE /api/v1/invoices/:id - Delete an invoice (soft delete)
invoicesRoutes.delete(
  "/:invoiceId",
  processRequest({ params: getInvoiceByIdSchema }),
  asyncHandler(deleteInvoice)
);

// POST /api/v1/invoices/:invoiceId/items - Add an invoice item
invoicesRoutes.post(
  "/:invoiceId/items",
  processRequest({
    params: getInvoiceByIdSchema,
    body: createInvoiceItemSchema,
  }),
  asyncHandler(addInvoiceItem)
);

// PATCH /api/v1/invoices/:invoiceId/items/:itemId - Update an invoice item
invoicesRoutes.patch(
  "/:invoiceId/items/:itemId",
  processRequest({
    params: getInvoiceItemByIdSchema,
    body: updateInvoiceItemSchema,
  }),
  asyncHandler(updateInvoiceItem)
);

// DELETE /api/v1/invoices/:invoiceId/items/:itemId - Delete an invoice item
invoicesRoutes.delete(
  "/:invoiceId/items/:itemId",
  processRequest({ params: getInvoiceItemByIdSchema }),
  asyncHandler(deleteInvoiceItem)
);

// POST /api/v1/invoices/:invoiceId/payments - Add a payment
invoicesRoutes.post(
  "/:invoiceId/payments",
  processRequest({
    params: getPaymentByIdSchema,
    body: createPaymentSchema.omit({ invoiceId: true }),
  }),
  asyncHandler(addPayment)
);

// PATCH /api/v1/invoices/:invoiceId/payments/:paymentId - Update a payment
invoicesRoutes.patch(
  "/:invoiceId/payments/:paymentId",
  processRequest({
    params: getPaymentByIdSchema,
    body: updatePaymentSchema,
  }),
  asyncHandler(updatePayment)
);

// DELETE /api/v1/invoices/:invoiceId/payments/:paymentId - Delete a payment (soft delete)
invoicesRoutes.delete(
  "/:invoiceId/payments/:paymentId",
  processRequest({ params: getPaymentByIdSchema }),
  asyncHandler(deletePayment)
);
