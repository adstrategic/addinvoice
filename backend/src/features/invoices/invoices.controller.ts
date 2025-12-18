import { Response } from "express";
import * as invoicesService from "./invoices.service";
import type {
  getInvoiceByIdSchema,
  createInvoiceSchema,
  updateInvoiceSchema,
  createInvoiceItemSchema,
  updateInvoiceItemSchema,
  getInvoiceItemByIdSchema,
  createPaymentSchema,
  updatePaymentSchema,
  getPaymentByIdSchema,
  getInvoiceBySequenceSchema,
} from "./invoices.schemas";
import { TypedRequest } from "zod-express-middleware";
import { listInvoicesSchema } from "./invoices.schemas";

/**
 * GET /invoices - List all invoices
 * No error handling needed - middleware handles it
 */
export async function listInvoices(
  req: TypedRequest<any, typeof listInvoicesSchema, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const query = req.query;

  const result = await invoicesService.listInvoices(workspaceId, query);
  res.json({
    success: true,
    data: result.invoices,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

/**
 * GET /invoices/next-number - Get next suggested invoice number
 * No error handling needed - middleware handles it
 */
export async function getNextInvoiceNumber(
  req: TypedRequest<any, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;

  const nextNumber = await invoicesService.getNextInvoiceNumberForWorkspace(
    workspaceId
  );

  res.json({
    success: true,
    data: { invoiceNumber: nextNumber },
  });
}

/**
 * GET /invoices/:id - Get invoice by ID
 * No error handling needed - middleware handles it
 */
export async function getInvoiceBySequence(
  req: TypedRequest<typeof getInvoiceBySequenceSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { sequence } = req.params;

  const invoice = await invoicesService.getInvoiceBySequence(
    workspaceId,
    sequence
  );

  res.json({
    success: true,
    data: invoice,
  });
}

/**
 * POST /invoices - Create a new invoice
 * No error handling needed - middleware handles it
 */
export async function createInvoice(
  req: TypedRequest<any, any, typeof createInvoiceSchema>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const body = req.body;

  const invoice = await invoicesService.createInvoice(workspaceId, body);

  res.status(201).json({
    success: true,
    data: invoice,
  });
}

/**
 * PATCH /invoices/:id - Update an invoice
 * No error handling needed - middleware handles it
 */
export async function updateInvoice(
  req: TypedRequest<
    typeof getInvoiceByIdSchema,
    any,
    typeof updateInvoiceSchema
  >,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId } = req.params;
  const body = req.body;

  const invoice = await invoicesService.updateInvoice(
    workspaceId,
    invoiceId,
    body
  );

  res.json({
    success: true,
    data: invoice,
  });
}

/**
 * DELETE /invoices/:id - Delete an invoice (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deleteInvoice(
  req: TypedRequest<typeof getInvoiceByIdSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId } = req.params;

  await invoicesService.deleteInvoice(workspaceId, invoiceId);

  res.json({
    success: true,
    message: "Invoice deleted successfully",
  });
}

/**
 * PATCH /invoices/:sequence/send - Mark invoice as sent
 * Called after email has been successfully sent from frontend
 * No error handling needed - middleware handles it
 */
export async function sendInvoice(
  req: TypedRequest<typeof getInvoiceByIdSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId } = req.params;

  const invoice = await invoicesService.markInvoiceAsSent(
    workspaceId,
    invoiceId
  );

  res.json({
    success: true,
    data: invoice,
    message: "Invoice marked as sent",
  });
}

/**
 * PATCH /invoices/:invoiceId/mark-as-paid - Mark invoice as paid
 * Updates invoice status to PAID and sets paidAt timestamp
 * No error handling needed - middleware handles it
 */
export async function markInvoiceAsPaid(
  req: TypedRequest<typeof getInvoiceByIdSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId } = req.params;

  const invoice = await invoicesService.markInvoiceAsPaid(
    workspaceId,
    invoiceId
  );

  res.json({
    success: true,
    data: invoice,
    message: "Invoice marked as paid",
  });
}

/**
 * POST /invoices/:invoiceId/items - Add an invoice item
 * No error handling needed - middleware handles it
 */
export async function addInvoiceItem(
  req: TypedRequest<
    typeof getInvoiceByIdSchema,
    any,
    typeof createInvoiceItemSchema
  >,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId } = req.params;
  const body = req.body;

  const item = await invoicesService.addInvoiceItem(
    workspaceId,
    invoiceId,
    body
  );

  res.status(201).json({
    success: true,
    data: item,
  });
}

/**
 * PATCH /invoices/:invoiceId/items/:itemId - Update an invoice item
 * No error handling needed - middleware handles it
 */
export async function updateInvoiceItem(
  req: TypedRequest<
    typeof getInvoiceItemByIdSchema,
    any,
    typeof updateInvoiceItemSchema
  >,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId, itemId } = req.params;
  const body = req.body;

  const item = await invoicesService.updateInvoiceItem(
    workspaceId,
    invoiceId,
    itemId,
    body
  );

  res.json({
    success: true,
    data: item,
  });
}

/**
 * DELETE /invoices/:invoiceId/items/:itemId - Delete an invoice item
 * No error handling needed - middleware handles it
 */
export async function deleteInvoiceItem(
  req: TypedRequest<typeof getInvoiceItemByIdSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId, itemId } = req.params;

  await invoicesService.deleteInvoiceItem(workspaceId, invoiceId, itemId);

  res.json({
    success: true,
    message: "Invoice item deleted successfully",
  });
}

/**
 * POST /invoices/:invoiceId/payments - Add a payment
 * No error handling needed - middleware handles it
 */
export async function addPayment(
  req: TypedRequest<
    typeof getPaymentByIdSchema,
    any,
    typeof createPaymentSchema
  >,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId } = req.params;
  const body = req.body;

  const payment = await invoicesService.addPayment(
    workspaceId,
    invoiceId,
    body
  );

  res.status(201).json({
    success: true,
    data: payment,
  });
}

/**
 * PATCH /invoices/:invoiceId/payments/:paymentId - Update a payment
 * No error handling needed - middleware handles it
 */
export async function updatePayment(
  req: TypedRequest<
    typeof getPaymentByIdSchema,
    any,
    typeof updatePaymentSchema
  >,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId, paymentId } = req.params;
  const body = req.body;

  const payment = await invoicesService.updatePayment(
    workspaceId,
    invoiceId,
    paymentId,
    body
  );

  res.json({
    success: true,
    data: payment,
  });
}

/**
 * DELETE /invoices/:invoiceId/payments/:paymentId - Delete a payment (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deletePayment(
  req: TypedRequest<typeof getPaymentByIdSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId, paymentId } = req.params;

  await invoicesService.deletePayment(workspaceId, invoiceId, paymentId);

  res.json({
    success: true,
    message: "Payment deleted successfully",
  });
}
