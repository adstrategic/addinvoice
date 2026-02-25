import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import type {
  createInvoiceItemSchema,
  createInvoiceSchema,
  getInvoiceByIdSchema,
  getInvoiceBySequenceSchema,
  getInvoiceItemByIdSchema,
  getPaymentByIdSchema,
  sendInvoiceBodySchema,
  updateInvoiceItemSchema,
  updateInvoiceSchema,
} from "./invoices.schemas.js";

import { getWorkspaceId } from "../../core/auth.js";
import { sendInvoiceQueue } from "../../queue/queues.js";
import {
  createPaymentSchema,
  updatePaymentSchema,
} from "../payments/payments.schemas.js";
import {
  getNextInvoiceNumberQuerySchema,
  listInvoicesSchema,
} from "./invoices.schemas.js";
import * as invoicesService from "./invoices.service.js";

/**
 * POST /invoices/:invoiceId/items - Add an invoice item
 * No error handling needed - middleware handles it
 */
export async function addInvoiceItem(
  req: TypedRequest<
    typeof getInvoiceByIdSchema,
    never,
    typeof createInvoiceItemSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { invoiceId } = req.params;
  const body = req.body;

  const item = await invoicesService.addInvoiceItem(
    workspaceId,
    invoiceId,
    body,
  );

  res.status(201).json({
    data: item,
  });
}

/**
 * POST /invoices/:invoiceId/payments - Add a payment
 * No error handling needed - middleware handles it
 */
export async function addPayment(
  req: TypedRequest<
    typeof getInvoiceByIdSchema,
    never,
    typeof createPaymentSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { invoiceId } = req.params;
  const body = req.body;

  const payment = await invoicesService.addPayment(
    workspaceId,
    invoiceId,
    body,
  );

  res.status(201).json({
    data: payment,
  });
}

/**
 * POST /invoices - Create a new invoice
 * No error handling needed - middleware handles it
 */
export async function createInvoice(
  req: TypedRequest<never, never, typeof createInvoiceSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const body = req.body;

  const invoice = await invoicesService.createInvoice(workspaceId, body);

  res.status(201).json({
    data: invoice,
  });
}

/**
 * DELETE /invoices/:id - Delete an invoice (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deleteInvoice(
  req: TypedRequest<typeof getInvoiceByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { invoiceId } = req.params;

  await invoicesService.deleteInvoice(workspaceId, invoiceId);

  res.json({
    message: "Invoice deleted successfully",
  });
}

/**
 * DELETE /invoices/:invoiceId/items/:itemId - Delete an invoice item
 * No error handling needed - middleware handles it
 */
export async function deleteInvoiceItem(
  req: TypedRequest<typeof getInvoiceItemByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { invoiceId, itemId } = req.params;

  await invoicesService.deleteInvoiceItem(workspaceId, invoiceId, itemId);

  res.json({
    message: "Invoice item deleted successfully",
  });
}

/**
 * DELETE /invoices/:invoiceId/payments/:paymentId - Delete a payment (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deletePayment(
  req: TypedRequest<typeof getPaymentByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { invoiceId, paymentId } = req.params;

  await invoicesService.deletePayment(workspaceId, invoiceId, paymentId);

  res.json({
    message: "Payment deleted successfully",
  });
}

/**
 * POST /invoices/:sequence/send - Enqueue send invoice email (returns 202)
 * Marks invoice as sent immediately; worker sends email. On worker failure, invoice is reverted to draft.
 */
export async function enqueueSendInvoice(
  req: TypedRequest<
    typeof getInvoiceBySequenceSchema,
    never,
    typeof sendInvoiceBodySchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;
  const { email, message, subject } = req.body;

  const invoice = await invoicesService.getInvoiceBySequence(
    workspaceId,
    sequence,
  );

  await invoicesService.markInvoiceAsSent(workspaceId, invoice.id);

  await sendInvoiceQueue.add("send-invoice", {
    email,
    invoiceId: invoice.id,
    message,
    sequence,
    subject,
    workspaceId,
  });

  res.status(202).json({
    message: "Invoice is being sent",
  });
}

/**
 * GET /invoices/:id - Get invoice by ID
 * No error handling needed - middleware handles it
 */
export async function getInvoiceBySequence(
  req: TypedRequest<typeof getInvoiceBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  const invoice = await invoicesService.getInvoiceBySequence(
    workspaceId,
    sequence,
  );

  res.json({
    data: invoice,
  });
}

/**
 * GET /invoices/:sequence/pdf - Get invoice as PDF (via external PDF service)
 */
export async function getInvoicePdf(
  req: TypedRequest<typeof getInvoiceBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  const invoice = await invoicesService.getInvoiceBySequence(
    workspaceId,
    sequence,
  );

  const pdfServiceUrl = process.env.PDF_SERVICE_URL?.trim();
  const pdfServiceSecret = process.env.PDF_SERVICE_SECRET?.trim();
  if (!pdfServiceUrl || !pdfServiceSecret) {
    console.error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
    res.status(500).json({ error: "Failed to generate PDF" });
    return;
  }

  const payload = invoicesService.buildInvoicePdfPayload(invoice);

  try {
    const pdfResponse = await fetch(
      `${pdfServiceUrl.replace(/\/$/, "")}/generate-invoice`,
      {
        body: JSON.stringify(payload),
        headers: {
          "Content-Type": "application/json",
          "X-PDF-Service-Key": pdfServiceSecret,
        },
        method: "POST",
      },
    );

    if (!pdfResponse.ok) {
      const errText = await pdfResponse.text();
      console.error("PDF service error:", pdfResponse.status, errText);
      res.status(500).json({
        error: "Failed to generate PDF",
        message: "PDF service unavailable",
      });
      return;
    }

    const pdfBuffer = Buffer.from(await pdfResponse.arrayBuffer());
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Failed to generate PDF:", err);
    res.status(500).json({
      error: "Failed to generate PDF",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/**
 * GET /invoices/next-number - Get next suggested invoice number
 * No error handling needed - middleware handles it
 */
export async function getNextInvoiceNumber(
  req: TypedRequest<never, typeof getNextInvoiceNumberQuerySchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { businessId } = req.query;

  const nextNumber = await invoicesService.getNextInvoiceNumberForWorkspace(
    workspaceId,
    businessId,
  );

  res.json({
    data: { invoiceNumber: nextNumber },
  });
}

/**
 * GET /invoices - List all invoices
 * No error handling needed - middleware handles it
 */
export async function listInvoices(
  req: TypedRequest<never, typeof listInvoicesSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const query = req.query;

  const result = await invoicesService.listInvoices(workspaceId, query);
  res.json({
    data: result.invoices,
    pagination: {
      limit: result.limit,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
    stats: result.stats,
  });
}

/**
 * PATCH /invoices/:invoiceId/send - Mark invoice as sent
 * Called by the queue worker after email has been sent (or from frontend if sync flow).
 * No error handling needed - middleware handles it
 */
export async function sendInvoice(
  req: TypedRequest<typeof getInvoiceByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { invoiceId } = req.params;

  const invoice = await invoicesService.markInvoiceAsSent(
    workspaceId,
    invoiceId,
  );

  res.json({
    data: invoice,
    message: "Invoice marked as sent",
  });
}

/**
 * PATCH /invoices/:id - Update an invoice
 * No error handling needed - middleware handles it
 */
export async function updateInvoice(
  req: TypedRequest<
    typeof getInvoiceByIdSchema,
    never,
    typeof updateInvoiceSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { invoiceId } = req.params;
  const body = req.body;

  const invoice = await invoicesService.updateInvoice(
    workspaceId,
    invoiceId,
    body,
  );

  res.json({
    data: invoice,
  });
}

/**
 * PATCH /invoices/:invoiceId/items/:itemId - Update an invoice item
 * No error handling needed - middleware handles it
 */
export async function updateInvoiceItem(
  req: TypedRequest<
    typeof getInvoiceItemByIdSchema,
    never,
    typeof updateInvoiceItemSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { invoiceId, itemId } = req.params;
  const body = req.body;

  const item = await invoicesService.updateInvoiceItem(
    workspaceId,
    invoiceId,
    itemId,
    body,
  );

  res.json({
    data: item,
  });
}

/**
 * PATCH /invoices/:invoiceId/payments/:paymentId - Update a payment
 * No error handling needed - middleware handles it
 */
export async function updatePayment(
  req: TypedRequest<
    typeof getPaymentByIdSchema,
    never,
    typeof updatePaymentSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { invoiceId, paymentId } = req.params;
  const body = req.body;

  const payment = await invoicesService.updatePayment(
    workspaceId,
    invoiceId,
    paymentId,
    body,
  );

  res.json({
    data: payment,
  });
}
