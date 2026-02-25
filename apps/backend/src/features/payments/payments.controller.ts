import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import type {
  getPaymentByIdSchema,
  sendReceiptBodySchema,
} from "./payments.schemas.js";

import { getWorkspaceId } from "../../core/auth.js";
import { sendReceiptQueue } from "../../queue/queues.js";
import * as invoicesService from "../invoices/invoices.service.js";
import { listPaymentsSchema } from "./payments.schemas.js";
import * as paymentsService from "./payments.service.js";

/**
 * POST /payments/:id/send-receipt - Enqueue send receipt email (returns 202)
 */
export async function enqueueSendReceipt(
  req: TypedRequest<
    typeof getPaymentByIdSchema,
    never,
    typeof sendReceiptBodySchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id: paymentId } = req.params;
  const { email, message, subject } = req.body;

  const payment = await paymentsService.getPaymentById(workspaceId, paymentId);

  await sendReceiptQueue.add("send-receipt", {
    email,
    invoiceId: payment.invoiceId,
    message,
    paymentId: payment.id,
    subject,
    workspaceId,
  });

  res.status(202).json({
    message: "Receipt is being sent",
  });
}

/**
 * GET /payments/:id - Get a single payment by ID with full context
 */
export async function getPaymentById(
  req: TypedRequest<typeof getPaymentByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;

  const payment = await paymentsService.getPaymentById(workspaceId, id);
  res.json({
    data: payment,
  });
}

/**
 * GET /payments/:id/receipt - Get receipt PDF for a payment (via external PDF service)
 */
export async function getReceiptPdf(
  req: TypedRequest<typeof getPaymentByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id: paymentId } = req.params;

  const payment = await paymentsService.getPaymentById(workspaceId, paymentId);
  const invoice = await invoicesService.getInvoiceById(
    workspaceId,
    payment.invoiceId,
  );
  const paymentEntity = invoice.payments?.find((p) => p.id === payment.id);
  if (!paymentEntity) {
    res.status(404).json({ error: "Payment not found" });
    return;
  }

  const pdfServiceUrl = process.env.PDF_SERVICE_URL?.trim();
  const pdfServiceSecret = process.env.PDF_SERVICE_SECRET?.trim();
  if (!pdfServiceUrl || !pdfServiceSecret) {
    console.error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
    res.status(500).json({ error: "Failed to generate PDF" });
    return;
  }

  const payload = invoicesService.buildReceiptPdfPayload(
    invoice,
    paymentEntity,
  );

  try {
    const pdfResponse = await fetch(
      `${pdfServiceUrl.replace(/\/$/, "")}/generate-receipt`,
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
      `attachment; filename="receipt-${invoice.invoiceNumber}-${String(payment.id)}.pdf"`,
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Failed to generate receipt PDF:", err);
    res.status(500).json({
      error: "Failed to generate PDF",
      message: err instanceof Error ? err.message : "Unknown error",
    });
  }
}

/**
 * GET /payments - List all payments for the workspace
 */
export async function listPayments(
  req: TypedRequest<never, typeof listPaymentsSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const query = req.query;

  const result = await paymentsService.listPayments(workspaceId, query);
  res.json({
    data: result.payments,
    pagination: {
      limit: result.limit,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
    totalAmount: result.totalAmount,
    totalCount: result.total,
  });
}
