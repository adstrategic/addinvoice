import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import {
  createEstimateItemSchema,
  createEstimateSchema,
  updateEstimateItemSchema,
  updateEstimateSchema,
} from "@addinvoice/schemas";

import type {
  getEstimateByIdSchema,
  getEstimateBySequenceSchema,
  getEstimateItemByIdSchema,
  sendEstimateBodySchema,
} from "./estimates.schemas.js";

import { getWorkspaceId } from "../../core/auth.js";
import { sendEstimateQueue } from "../../queue/queues.js";
import {
  getNextEstimateNumberQuerySchema,
  listEstimatesSchema,
} from "./estimates.schemas.js";
import * as estimatesService from "./estimates.service.js";

/**
 * POST /estimates/:estimateId/items - Add an estimate item
 * No error handling needed - middleware handles it
 */
export async function addEstimateItem(
  req: TypedRequest<
    typeof getEstimateByIdSchema,
    never,
    typeof createEstimateItemSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { estimateId } = req.params;
  const body = req.body;

  const item = await estimatesService.addEstimateItem(
    workspaceId,
    estimateId,
    body,
  );

  res.status(201).json({
    data: item,
  });
}

/**
 * POST /estimates - Create a new estimate
 * No error handling needed - middleware handles it
 */
export async function createEstimate(
  req: TypedRequest<never, never, typeof createEstimateSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const body = req.body;

  const estimate = await estimatesService.createEstimate(workspaceId, body);

  res.status(201).json({
    data: estimate,
  });
}

/**
 * DELETE /estimates/:id - Delete an estimate (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deleteEstimate(
  req: TypedRequest<typeof getEstimateByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { estimateId } = req.params;

  await estimatesService.deleteEstimate(workspaceId, estimateId);

  res.json({
    message: "Estimate deleted successfully",
  });
}

/**
 * DELETE /estimates/:estimateId/items/:itemId - Delete an estimate item
 * No error handling needed - middleware handles it
 */
export async function deleteEstimateItem(
  req: TypedRequest<typeof getEstimateItemByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { estimateId, itemId } = req.params;

  await estimatesService.deleteEstimateItem(workspaceId, estimateId, itemId);

  res.json({
    message: "Estimate item deleted successfully",
  });
}

/**
 * POST /estimates/:sequence/send - Enqueue send estimate email (returns 202)
 * Marks estimate as sent immediately; worker sends email. On worker failure, estimate is reverted to draft.
 */
export async function enqueueSendEstimate(
  req: TypedRequest<
    typeof getEstimateBySequenceSchema,
    never,
    typeof sendEstimateBodySchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;
  const { email, message, subject } = req.body;

  const estimate = await estimatesService.getEstimateBySequence(
    workspaceId,
    sequence,
  );

  await estimatesService.markEstimateAsSent(workspaceId, estimate.id);

  await sendEstimateQueue.add("send-estimate", {
    email,
    estimateId: estimate.id,
    message,
    sequence,
    subject,
    workspaceId,
  });

  res.status(202).json({
    message: "Estimate is being sent",
  });
}

/**
 * GET /estimates/:id - Get estimate by ID
 * No error handling needed - middleware handles it
 */
export async function getEstimateBySequence(
  req: TypedRequest<typeof getEstimateBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  const estimate = await estimatesService.getEstimateBySequence(
    workspaceId,
    sequence,
  );

  res.json({
    data: estimate,
  });
}

/**
 * POST /estimates/:sequence/convert-to-invoice - Convert accepted estimate to invoice
 */
export async function convertEstimateToInvoice(
  req: TypedRequest<typeof getEstimateBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  const invoice = await estimatesService.convertEstimateToInvoice(
    workspaceId,
    sequence,
  );

  res.status(201).json({
    data: invoice,
    message: "Estimate converted to invoice successfully",
  });
}

/**
 * GET /estimates/:sequence/pdf - Get estimate as PDF (via external PDF service)
 */
export async function getEstimatePdf(
  req: TypedRequest<typeof getEstimateBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  const estimate = await estimatesService.getEstimateBySequence(
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

  const payload = estimatesService.buildEstimatePdfPayload(estimate);

  try {
    const pdfResponse = await fetch(
      `${pdfServiceUrl.replace(/\/$/, "")}/generate-estimate`,
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
      `attachment; filename="estimate-${estimate.estimateNumber}.pdf"`,
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
 * GET /estimates/next-number - Get next suggested estimate number
 * No error handling needed - middleware handles it
 */
export async function getNextEstimateNumber(
  req: TypedRequest<never, typeof getNextEstimateNumberQuerySchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { businessId } = req.query;

  const nextNumber = await estimatesService.getNextEstimateNumberForWorkspace(
    workspaceId,
    businessId,
  );

  res.json({
    data: { estimateNumber: nextNumber },
  });
}

/**
 * GET /estimates - List all estimates
 * No error handling needed - middleware handles it
 */
export async function listEstimates(
  req: TypedRequest<never, typeof listEstimatesSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const query = req.query;

  const result = await estimatesService.listEstimates(workspaceId, query);
  res.json({
    data: result.estimates,
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
 * PATCH /estimates/:estimateId/send - Mark estimate as sent
 * Called by the queue worker after email has been sent (or from frontend if sync flow).
 * No error handling needed - middleware handles it
 */
export async function sendEstimate(
  req: TypedRequest<typeof getEstimateByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { estimateId } = req.params;

  const estimate = await estimatesService.markEstimateAsSent(
    workspaceId,
    estimateId,
  );

  res.json({
    data: estimate,
    message: "Estimate marked as sent",
  });
}

/**
 * PATCH /estimates/:estimateId/accept - Mark estimate as accepted
 * No error handling needed - middleware handles it
 */
export async function markEstimateAsAccepted(
  req: TypedRequest<typeof getEstimateByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { estimateId } = req.params;

  const estimate = await estimatesService.markEstimateAsAccepted(
    workspaceId,
    estimateId,
  );

  res.json({
    data: estimate,
    message: "Estimate marked as accepted",
  });
}

/**
 * PATCH /estimates/:id - Update an estimate
 * No error handling needed - middleware handles it
 */
export async function updateEstimate(
  req: TypedRequest<
    typeof getEstimateByIdSchema,
    never,
    typeof updateEstimateSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { estimateId } = req.params;
  const body = req.body;

  const estimate = await estimatesService.updateEstimate(
    workspaceId,
    estimateId,
    body,
  );

  res.json({
    data: estimate,
  });
}

/**
 * PATCH /estimates/:estimateId/items/:itemId - Update an estimate item
 * No error handling needed - middleware handles it
 */
export async function updateEstimateItem(
  req: TypedRequest<
    typeof getEstimateItemByIdSchema,
    never,
    typeof updateEstimateItemSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { estimateId, itemId } = req.params;
  const body = req.body;

  const item = await estimatesService.updateEstimateItem(
    workspaceId,
    estimateId,
    itemId,
    body,
  );

  res.json({
    data: item,
  });
}
