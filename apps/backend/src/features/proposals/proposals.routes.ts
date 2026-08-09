import {
  createProposalDescriptiveItemSchema,
  updateProposalDescriptiveItemSchema,
  updateProposalSchema,
} from "@addinvoice/schemas";
import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  addProposalDescriptiveItem,
  convertEstimateToProposal,
  convertProposalToInvoice,
  deleteProposal,
  deleteProposalDescriptiveItem,
  voidProposal,
  getProposalBySequence,
  getProposalPdf,
  getProposalPreview,
  getProposalPreviewPage,
  listProposals,
  markProposalAsAccepted,
  resendProposal,
  shareProposalPublicLink,
  updateProposal,
  updateProposalDescriptiveItem,
} from "./proposals.controller.js";
import {
  convertEstimateToProposalBodySchema,
  getEstimateBySequenceForProposalSchema,
  getProposalByIdSchema,
  getProposalBySequenceSchema,
  getProposalDescriptiveItemByIdSchema,
  getProposalPreviewPageParamsSchema,
  listProposalsSchema,
} from "./proposals.schemas.js";
import { previewHashQuerySchema } from "../_shared/preview-schemas.js";

/**
 * Proposals routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const proposalsRoutes: Router = Router();

// POST /api/v1/proposals/from-estimate/:estimateSequence - Convert accepted estimate to proposal
proposalsRoutes.post(
  "/from-estimate/:estimateSequence",
  processRequest({
    params: getEstimateBySequenceForProposalSchema,
    body: convertEstimateToProposalBodySchema,
  }),
  asyncHandler(convertEstimateToProposal),
);

// GET /api/v1/proposals - List all proposals
proposalsRoutes.get(
  "/",
  processRequest({ query: listProposalsSchema }),
  asyncHandler(listProposals),
);

// GET /api/v1/proposals/:sequence/pdf - Get proposal as PDF (must be before /:sequence)
proposalsRoutes.get(
  "/:sequence/pdf",
  processRequest({ params: getProposalBySequenceSchema }),
  asyncHandler(getProposalPdf),
);

// GET /api/v1/proposals/:sequence/preview/:page - Preview page image
proposalsRoutes.get(
  "/:sequence/preview/:page",
  processRequest({
    params: getProposalPreviewPageParamsSchema,
    query: previewHashQuerySchema,
  }),
  asyncHandler(getProposalPreviewPage),
);

// GET /api/v1/proposals/:sequence/preview - Preview metadata
proposalsRoutes.get(
  "/:sequence/preview",
  processRequest({ params: getProposalBySequenceSchema }),
  asyncHandler(getProposalPreview),
);

// POST /api/v1/proposals/:sequence/send - Resend proposal (must be before /:sequence)
proposalsRoutes.post(
  "/:sequence/send",
  processRequest({ params: getProposalBySequenceSchema }),
  asyncHandler(resendProposal),
);

// POST /api/v1/proposals/:sequence/share-link - Issue via public link
proposalsRoutes.post(
  "/:sequence/share-link",
  processRequest({ params: getProposalBySequenceSchema }),
  asyncHandler(shareProposalPublicLink),
);

// GET /api/v1/proposals/:sequence - Get proposal by sequence
proposalsRoutes.get(
  "/:sequence",
  processRequest({ params: getProposalBySequenceSchema }),
  asyncHandler(getProposalBySequence),
);

// POST /api/v1/proposals/:sequence/convert-to-invoice - Convert accepted proposal to invoice (must be before /:sequence)
proposalsRoutes.post(
  "/:sequence/convert-to-invoice",
  processRequest({ params: getProposalBySequenceSchema }),
  asyncHandler(convertProposalToInvoice),
);

// PATCH /api/v1/proposals/:proposalId/accept - Mark proposal as accepted (must be before /:proposalId)
proposalsRoutes.patch(
  "/:proposalId/accept",
  processRequest({ params: getProposalByIdSchema }),
  asyncHandler(markProposalAsAccepted),
);

// PATCH /api/v1/proposals/:proposalId - Update a proposal
proposalsRoutes.patch(
  "/:proposalId",
  processRequest({
    body: updateProposalSchema,
    params: getProposalByIdSchema,
  }),
  asyncHandler(updateProposal),
);

// DELETE /api/v1/proposals/:proposalId - Delete a proposal
proposalsRoutes.delete(
  "/:proposalId",
  processRequest({ params: getProposalByIdSchema }),
  asyncHandler(deleteProposal),
);

// POST /api/v1/proposals/:proposalId/void - Mark proposal as voided
proposalsRoutes.post(
  "/:proposalId/void",
  processRequest({ params: getProposalByIdSchema }),
  asyncHandler(voidProposal),
);

// POST /api/v1/proposals/:proposalId/descriptive-items - Add a descriptive item
proposalsRoutes.post(
  "/:proposalId/descriptive-items",
  processRequest({
    body: createProposalDescriptiveItemSchema,
    params: getProposalByIdSchema,
  }),
  asyncHandler(addProposalDescriptiveItem),
);

// PATCH /api/v1/proposals/:proposalId/descriptive-items/:descriptiveItemId - Update a descriptive item
proposalsRoutes.patch(
  "/:proposalId/descriptive-items/:descriptiveItemId",
  processRequest({
    body: updateProposalDescriptiveItemSchema,
    params: getProposalDescriptiveItemByIdSchema,
  }),
  asyncHandler(updateProposalDescriptiveItem),
);

// DELETE /api/v1/proposals/:proposalId/descriptive-items/:descriptiveItemId - Delete a descriptive item
proposalsRoutes.delete(
  "/:proposalId/descriptive-items/:descriptiveItemId",
  processRequest({ params: getProposalDescriptiveItemByIdSchema }),
  asyncHandler(deleteProposalDescriptiveItem),
);
