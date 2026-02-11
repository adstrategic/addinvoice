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
 * Compute item line total (after item discount + tax) for PDF when item.total is missing.
 * Mirrors the service layer logic so the fallback is correct.
 */
function computeItemTotalForPdf(
  item: {
    quantity: number;
    unitPrice: number;
    discount: number;
    discountType: string;
    tax: number;
    vatEnabled: boolean;
  },
  invoice: {
    taxMode: string;
    taxPercentage: number | null;
  },
): number {
  const baseAmount = Number(item.quantity) * Number(item.unitPrice);
  let afterDiscount = baseAmount;
  if (item.discountType === "PERCENTAGE") {
    afterDiscount = baseAmount - (baseAmount * Number(item.discount)) / 100;
  } else if (item.discountType === "FIXED") {
    afterDiscount = baseAmount - Number(item.discount);
  }
  let taxAmount = 0;
  if (invoice.taxMode === "BY_PRODUCT") {
    taxAmount = (afterDiscount * Number(item.tax)) / 100;
  } else if (
    invoice.taxMode === "BY_TOTAL" &&
    item.vatEnabled &&
    invoice.taxPercentage
  ) {
    taxAmount = (afterDiscount * invoice.taxPercentage) / 100;
  }
  return afterDiscount + taxAmount;
}

/**
 * GET /invoices - List all invoices
 * No error handling needed - middleware handles it
 */
export async function listInvoices(
  req: TypedRequest<any, typeof listInvoicesSchema, any>,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const query = req.query;

  const result = await invoicesService.listInvoices(workspaceId, query);
  res.json({
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
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;

  const nextNumber =
    await invoicesService.getNextInvoiceNumberForWorkspace(workspaceId);

  res.json({
    data: { invoiceNumber: nextNumber },
  });
}

/**
 * GET /invoices/:id - Get invoice by ID
 * No error handling needed - middleware handles it
 */
export async function getInvoiceBySequence(
  req: TypedRequest<typeof getInvoiceBySequenceSchema, any, any>,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
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
  req: TypedRequest<typeof getInvoiceBySequenceSchema, any, any>,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { sequence } = req.params;

  const invoice = await invoicesService.getInvoiceBySequence(
    workspaceId,
    sequence,
  );

  if (!invoice.client) {
    res.status(400).json({
      error: "Invoice client data missing",
    });
    return;
  }

  const pdfServiceUrl = process.env.PDF_SERVICE_URL?.trim();
  const pdfServiceSecret = process.env.PDF_SERVICE_SECRET?.trim();
  if (!pdfServiceUrl || !pdfServiceSecret) {
    console.error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
    res.status(500).json({ error: "Failed to generate PDF" });
    return;
  }

  const payload = {
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      issueDate:
        typeof invoice.issueDate === "string"
          ? invoice.issueDate
          : invoice.issueDate.toISOString(),
      dueDate:
        typeof invoice.dueDate === "string"
          ? invoice.dueDate
          : invoice.dueDate.toISOString(),
      purchaseOrder: invoice.purchaseOrder,
      currency: invoice.currency,
      subtotal: invoice.subtotal,
      discount: invoice.discount,
      totalTax: invoice.totalTax,
      total: invoice.total,
      notes: invoice.notes,
      terms: invoice.terms,
    },
    client: {
      name: invoice.client.name,
      businessName: invoice.client.businessName,
      address: invoice.client.address,
      phone: invoice.client.phone,
      email: invoice.client.email,
      nit: invoice.client.nit,
    },
    company: {
      name: invoice.business.name,
      address: invoice.business.address,
      email: invoice.business.email,
      phone: invoice.business.phone,
      nit: invoice.business.nit,
      logo: invoice.business.logo,
    },
    items: (invoice.items || []).map((item) => {
      const total: number = computeItemTotalForPdf(
        {
          quantity: Number(item.quantity ?? 0),
          unitPrice: Number(item.unitPrice ?? 0),
          discount: Number(item.discount ?? 0),
          discountType:
            (item as { discountType?: string }).discountType ?? "NONE",
          tax: Number(item.tax ?? 0),
          vatEnabled: Boolean((item as { vatEnabled?: boolean }).vatEnabled),
        },
        {
          taxMode: invoice.taxMode,
          taxPercentage: invoice.taxPercentage ?? null,
        },
      );
      return {
        name: item.name,
        description: item.description,
        quantity: Number(item.quantity ?? 0),
        quantityUnit: item.quantityUnit,
        unitPrice: Number(item.unitPrice ?? 0),
        tax: Number(item.tax ?? 0),
        total,
      };
    }),
  };

  try {
    const pdfResponse = await fetch(
      `${pdfServiceUrl.replace(/\/$/, "")}/generate-invoice`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-PDF-Service-Key": pdfServiceSecret as string,
        },
        body: JSON.stringify(payload),
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
 * POST /invoices - Create a new invoice
 * No error handling needed - middleware handles it
 */
export async function createInvoice(
  req: TypedRequest<any, any, typeof createInvoiceSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const body = req.body;

  const invoice = await invoicesService.createInvoice(workspaceId, body);

  res.status(201).json({
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
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
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
 * DELETE /invoices/:id - Delete an invoice (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deleteInvoice(
  req: TypedRequest<typeof getInvoiceByIdSchema, any, any>,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId } = req.params;

  await invoicesService.deleteInvoice(workspaceId, invoiceId);

  res.json({
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
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
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
 * POST /invoices/:invoiceId/items - Add an invoice item
 * No error handling needed - middleware handles it
 */
export async function addInvoiceItem(
  req: TypedRequest<
    typeof getInvoiceByIdSchema,
    any,
    typeof createInvoiceItemSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
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
 * PATCH /invoices/:invoiceId/items/:itemId - Update an invoice item
 * No error handling needed - middleware handles it
 */
export async function updateInvoiceItem(
  req: TypedRequest<
    typeof getInvoiceItemByIdSchema,
    any,
    typeof updateInvoiceItemSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
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
 * DELETE /invoices/:invoiceId/items/:itemId - Delete an invoice item
 * No error handling needed - middleware handles it
 */
export async function deleteInvoiceItem(
  req: TypedRequest<typeof getInvoiceItemByIdSchema, any, any>,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId, itemId } = req.params;

  await invoicesService.deleteInvoiceItem(workspaceId, invoiceId, itemId);

  res.json({
    message: "Invoice item deleted successfully",
  });
}

/**
 * POST /invoices/:invoiceId/payments - Add a payment
 * No error handling needed - middleware handles it
 */
export async function addPayment(
  req: TypedRequest<
    typeof getInvoiceByIdSchema,
    any,
    typeof createPaymentSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
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
 * PATCH /invoices/:invoiceId/payments/:paymentId - Update a payment
 * No error handling needed - middleware handles it
 */
export async function updatePayment(
  req: TypedRequest<
    typeof getPaymentByIdSchema,
    any,
    typeof updatePaymentSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
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

/**
 * DELETE /invoices/:invoiceId/payments/:paymentId - Delete a payment (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deletePayment(
  req: TypedRequest<typeof getPaymentByIdSchema, any, any>,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { invoiceId, paymentId } = req.params;

  await invoicesService.deletePayment(workspaceId, invoiceId, paymentId);

  res.json({
    message: "Payment deleted successfully",
  });
}
