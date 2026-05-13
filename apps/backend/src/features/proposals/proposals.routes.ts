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
  getProposalBySequence,
  getProposalPdf,
  listProposals,
  markProposalAsAccepted,
  resendProposal,
  updateProposal,
  updateProposalDescriptiveItem,
} from "./proposals.controller.js";
import {
  getEstimateBySequenceForProposalSchema,
  getProposalByIdSchema,
  getProposalBySequenceSchema,
  getProposalDescriptiveItemByIdSchema,
  listProposalsSchema,
} from "./proposals.schemas.js";

/**
 * Proposals routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const proposalsRoutes: Router = Router();

// POST /api/v1/proposals/from-estimate/:estimateSequence - Convert accepted estimate to proposal
proposalsRoutes.post(
  "/from-estimate/:estimateSequence",
  processRequest({ params: getEstimateBySequenceForProposalSchema }),
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

// POST /api/v1/proposals/:sequence/send - Resend proposal (must be before /:sequence)
proposalsRoutes.post(
  "/:sequence/send",
  processRequest({ params: getProposalBySequenceSchema }),
  asyncHandler(resendProposal),
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
