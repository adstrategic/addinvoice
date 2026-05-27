import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import {
  createProposalDescriptiveItemSchema,
  updateProposalDescriptiveItemSchema,
  updateProposalSchema,
} from "@addinvoice/schemas";

import type {
  convertEstimateToProposalBodySchema,
  getEstimateBySequenceForProposalSchema,
  getProposalByIdSchema,
  getProposalBySequenceSchema,
  getProposalDescriptiveItemByIdSchema,
} from "./proposals.schemas.js";

import { getWorkspaceId } from "../../core/auth.js";
import { listProposalsSchema } from "./proposals.schemas.js";
import * as proposalsService from "./proposals.service.js";

/**
 * POST /proposals/from-estimate/:estimateSequence - Convert an accepted estimate to a proposal
 */
export async function convertEstimateToProposal(
  req: TypedRequest<
    typeof getEstimateBySequenceForProposalSchema,
    never,
    typeof convertEstimateToProposalBodySchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { estimateSequence } = req.params;
  const emailData = req.body;

  const proposal = await proposalsService.convertEstimateToProposal(
    workspaceId,
    estimateSequence,
    emailData,
  );

  res.status(201).json({
    data: proposal,
  });
}

/**
 * GET /proposals - List all proposals
 */
export async function listProposals(
  req: TypedRequest<never, typeof listProposalsSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const query = req.query;

  const result = await proposalsService.listProposals(workspaceId, query);
  res.json({
    data: result.proposals,
    pagination: {
      limit: result.limit,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

/**
 * GET /proposals/:sequence - Get proposal by sequence number
 */
export async function getProposalBySequence(
  req: TypedRequest<typeof getProposalBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  const proposal = await proposalsService.getProposalBySequence(
    workspaceId,
    sequence,
  );

  res.json({
    data: proposal,
  });
}

/**
 * PATCH /proposals/:proposalId - Update a proposal
 */
export async function updateProposal(
  req: TypedRequest<
    typeof getProposalByIdSchema,
    never,
    typeof updateProposalSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { proposalId } = req.params;
  const body = req.body;

  const proposal = await proposalsService.updateProposal(
    workspaceId,
    proposalId,
    body,
  );

  res.json({
    data: proposal,
  });
}

/**
 * DELETE /proposals/:proposalId - Delete a proposal
 */
export async function deleteProposal(
  req: TypedRequest<typeof getProposalByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { proposalId } = req.params;

  await proposalsService.deleteProposal(workspaceId, proposalId);

  res.json({
    message: "Proposal deleted successfully",
  });
}

/**
 * POST /proposals/:proposalId/void - Mark a proposal as voided
 */
export async function voidProposal(
  req: TypedRequest<typeof getProposalByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { proposalId } = req.params;

  const proposal = await proposalsService.voidProposal(workspaceId, proposalId);

  res.json({
    data: proposal,
    message: "Proposal voided successfully",
  });
}

/**
 * POST /proposals/:sequence/share-link - Issue proposal and return public share slug
 */
export async function shareProposalPublicLink(
  req: TypedRequest<typeof getProposalBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;
  const data = await proposalsService.shareProposalPublicLink(
    workspaceId,
    sequence,
  );
  res.json({ data });
}

/**
 * POST /proposals/:sequence/send - Resend a rejected proposal (returns 202)
 */
export async function resendProposal(
  req: TypedRequest<typeof getProposalBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  await proposalsService.resendProposal(workspaceId, sequence);

  res.status(202).json({
    message: "Proposal is being sent",
  });
}

/**
 * PATCH /proposals/:proposalId/accept - Mark a proposal as accepted
 */
export async function markProposalAsAccepted(
  req: TypedRequest<typeof getProposalByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { proposalId } = req.params;

  const proposal = await proposalsService.markProposalAsAccepted(
    workspaceId,
    proposalId,
  );

  res.json({
    data: proposal,
    message: "Proposal marked as accepted",
  });
}

/**
 * GET /proposals/:sequence/pdf - Get proposal as PDF (via external PDF service)
 */
export async function getProposalPdf(
  req: TypedRequest<typeof getProposalBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  const proposal = await proposalsService.getProposalBySequence(
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

  const payload = proposalsService.buildProposalPdfPayload(proposal);

  try {
    const pdfResponse = await fetch(
      `${pdfServiceUrl.replace(/\/$/, "")}/generate-proposal`,
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
 * POST /proposals/:sequence/convert-to-invoice - Convert an accepted proposal to an invoice
 */
export async function convertProposalToInvoice(
  req: TypedRequest<typeof getProposalBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  const invoice = await proposalsService.convertProposalToInvoice(
    workspaceId,
    sequence,
  );

  res.status(201).json({
    data: invoice,
    message: "Proposal converted to invoice successfully",
  });
}

/**
 * POST /proposals/:proposalId/descriptive-items - Add a descriptive item to a proposal
 */
export async function addProposalDescriptiveItem(
  req: TypedRequest<
    typeof getProposalByIdSchema,
    never,
    typeof createProposalDescriptiveItemSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { proposalId } = req.params;
  const body = req.body;

  const item = await proposalsService.addProposalDescriptiveItem(
    workspaceId,
    proposalId,
    body,
  );

  res.status(201).json({
    data: item,
  });
}

/**
 * PATCH /proposals/:proposalId/descriptive-items/:descriptiveItemId - Update a descriptive item
 */
export async function updateProposalDescriptiveItem(
  req: TypedRequest<
    typeof getProposalDescriptiveItemByIdSchema,
    never,
    typeof updateProposalDescriptiveItemSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { proposalId, descriptiveItemId } = req.params;
  const body = req.body;

  const item = await proposalsService.updateProposalDescriptiveItem(
    workspaceId,
    proposalId,
    descriptiveItemId,
    body,
  );

  res.json({
    data: item,
  });
}

/**
 * DELETE /proposals/:proposalId/descriptive-items/:descriptiveItemId - Delete a descriptive item
 */
export async function deleteProposalDescriptiveItem(
  req: TypedRequest<typeof getProposalDescriptiveItemByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { proposalId, descriptiveItemId } = req.params;

  await proposalsService.deleteProposalDescriptiveItem(
    workspaceId,
    proposalId,
    descriptiveItemId,
  );

  res.json({
    message: "Proposal descriptive item deleted successfully",
  });
}
