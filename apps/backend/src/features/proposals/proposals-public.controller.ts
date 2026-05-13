import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import {
  acceptProposalBodySchema,
  getProposalByTokenParamsSchema,
  rejectProposalBodySchema,
} from "./proposals.schemas.js";
import * as proposalsService from "./proposals.service.js";

/**
 * GET /api/v1/public/proposals/accept/:token - Get proposal summary by signing token (public).
 * Returns 404 if not found, 410 if expired or already accepted/rejected.
 */
export async function getProposalByToken(
  req: TypedRequest<typeof getProposalByTokenParamsSchema, never, never>,
  res: Response,
): Promise<void> {
  const { token } = req.params;
  const data = await proposalsService.getProposalBySigningToken(token);
  res.json({ data });
}

/**
 * GET /api/v1/public/proposals/accept/:token/pdf - Get proposal as PDF by signing token (public).
 */
export async function getProposalPdfByToken(
  req: TypedRequest<typeof getProposalByTokenParamsSchema, never, never>,
  res: Response,
): Promise<void> {
  const { token } = req.params;
  const proposal = await proposalsService.getProposalBySigningToken(token);

  const pdfServiceUrl = process.env.PDF_SERVICE_URL?.trim();
  const pdfServiceSecret = process.env.PDF_SERVICE_SECRET?.trim();
  if (!pdfServiceUrl || !pdfServiceSecret) {
    console.error("PDF_SERVICE_URL or PDF_SERVICE_SECRET not configured");
    res.status(500).json({ error: "Failed to generate PDF" });
    return;
  }

  const payload = proposalsService.buildProposalPdfPayload(proposal);

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
      `attachment; filename="proposal-${proposal.proposalNumber}.pdf"`,
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
 * POST /api/v1/public/proposals/accept/:token - Accept proposal by signing token (public).
 */
export async function acceptProposalByToken(
  req: TypedRequest<
    typeof getProposalByTokenParamsSchema,
    never,
    typeof acceptProposalBodySchema
  >,
  res: Response,
): Promise<void> {
  const { token } = req.params;
  const body = req.body;
  await proposalsService.acceptProposalByToken(token, body);
  res.json({ message: "Proposal accepted" });
}

/**
 * POST /api/v1/public/proposals/reject/:token - Reject proposal by signing token (public).
 */
export async function rejectProposalByToken(
  req: TypedRequest<
    typeof getProposalByTokenParamsSchema,
    never,
    typeof rejectProposalBodySchema
  >,
  res: Response,
): Promise<void> {
  const { token } = req.params;
  const body = req.body;
  await proposalsService.rejectProposalByToken(token, body);
  res.json({ message: "Proposal rejected" });
}
