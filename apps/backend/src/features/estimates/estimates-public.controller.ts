import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import {
  getPreviewMetadata,
  getPreviewPage,
} from "../_shared/document-preview.js";
import {
  sendPreviewMetadata,
  sendPreviewPage,
} from "../_shared/preview-http.js";
import { previewHashQuerySchema } from "../_shared/preview-schemas.js";
import {
  acceptEstimateBodySchema,
  getEstimateByTokenParamsSchema,
  getEstimatePreviewPageByTokenParamsSchema,
  rejectEstimateBodySchema,
} from "./estimates.schemas.js";
import * as estimatesService from "./estimates.service.js";

/**
 * GET /api/v1/public/estimates/accept/:token - Get estimate summary by signing token (public).
 * Returns 404 if not found, 410 if expired or already accepted.
 */
export async function getEstimateByToken(
  req: TypedRequest<typeof getEstimateByTokenParamsSchema, never, never>,
  res: Response,
): Promise<void> {
  const { token } = req.params;
  const data = await estimatesService.getEstimateBySigningToken(token);
  res.json({ data });
}

/**
 * GET /api/v1/public/estimates/accept/:token/pdf - Get estimate as PDF by signing token (public).
 */
export async function getEstimatePdfByToken(
  req: TypedRequest<typeof getEstimateByTokenParamsSchema, never, never>,
  res: Response,
): Promise<void> {
  const { token } = req.params;
  const estimate = await estimatesService.getEstimateBySigningToken(token);

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
 * GET /api/v1/public/estimates/accept/:token/preview - Preview metadata
 */
export async function getEstimatePreviewByToken(
  req: TypedRequest<typeof getEstimateByTokenParamsSchema, never, never>,
  res: Response,
): Promise<void> {
  const { token } = req.params;
  const estimate = await estimatesService.getEstimateBySigningToken(token);
  const payload = estimatesService.buildEstimatePdfPayload(estimate);
  const metadata = await getPreviewMetadata({
    kind: "estimate",
    workspaceId: String(estimate.workspaceId),
    sequence: estimate.sequence,
    payload,
  });
  sendPreviewMetadata(res, metadata);
}

/**
 * GET /api/v1/public/estimates/accept/:token/preview/:page?hash=
 */
export async function getEstimatePreviewPageByToken(
  req: TypedRequest<
    typeof getEstimatePreviewPageByTokenParamsSchema,
    typeof previewHashQuerySchema,
    never
  >,
  res: Response,
): Promise<void> {
  const { token, page } = req.params;
  const { hash } = req.query;
  const estimate = await estimatesService.getEstimateBySigningToken(token);
  const payload = estimatesService.buildEstimatePdfPayload(estimate);
  const result = await getPreviewPage({
    kind: "estimate",
    workspaceId: String(estimate.workspaceId),
    sequence: estimate.sequence,
    hash,
    page,
    payload,
  });
  sendPreviewPage(res, result, page);
}

/**
 * POST /api/v1/public/estimates/accept/:token - Accept estimate by signing token (public).
 * Returns 409 if already accepted.
 */
export async function acceptEstimateByToken(
  req: TypedRequest<
    typeof getEstimateByTokenParamsSchema,
    never,
    typeof acceptEstimateBodySchema
  >,
  res: Response,
): Promise<void> {
  const { token } = req.params;
  const body = req.body;
  await estimatesService.acceptEstimateByToken(token, body);
  res.json({ message: "Estimate accepted" });
}

/**
 * POST /api/v1/public/estimates/reject/:token - Reject estimate by signing token (public).
 * Returns 409 if already accepted.
 */
export async function rejectEstimateByToken(
  req: TypedRequest<
    typeof getEstimateByTokenParamsSchema,
    never,
    typeof rejectEstimateBodySchema
  >,
  res: Response,
): Promise<void> {
  const { token } = req.params;
  const body = req.body;
  await estimatesService.rejectEstimateByToken(token, body);
  res.json({ message: "Estimate rejected" });
}
