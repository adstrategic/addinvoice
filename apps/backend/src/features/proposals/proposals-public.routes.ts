import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  acceptProposalByToken,
  getProposalByToken,
  getProposalPdfByToken,
  getProposalPreviewByToken,
  getProposalPreviewPageByToken,
  rejectProposalByToken,
} from "./proposals-public.controller.js";
import {
  acceptProposalBodySchema,
  getProposalByTokenParamsSchema,
  getProposalPreviewPageByTokenParamsSchema,
  rejectProposalBodySchema,
} from "./proposals.schemas.js";
import { previewHashQuerySchema } from "../_shared/preview-schemas.js";

/**
 * Public proposal routes (no auth).
 * View proposal by signing token, accept or reject proposal.
 */
export const proposalsPublicRoutes: Router = Router();

// GET /api/v1/public/proposals/accept/:token
proposalsPublicRoutes.get(
  "/accept/:token",
  processRequest({ params: getProposalByTokenParamsSchema }),
  asyncHandler(getProposalByToken),
);

// GET /api/v1/public/proposals/accept/:token/pdf
proposalsPublicRoutes.get(
  "/accept/:token/pdf",
  processRequest({ params: getProposalByTokenParamsSchema }),
  asyncHandler(getProposalPdfByToken),
);

// GET /api/v1/public/proposals/accept/:token/preview/:page
proposalsPublicRoutes.get(
  "/accept/:token/preview/:page",
  processRequest({
    params: getProposalPreviewPageByTokenParamsSchema,
    query: previewHashQuerySchema,
  }),
  asyncHandler(getProposalPreviewPageByToken),
);

// GET /api/v1/public/proposals/accept/:token/preview
proposalsPublicRoutes.get(
  "/accept/:token/preview",
  processRequest({ params: getProposalByTokenParamsSchema }),
  asyncHandler(getProposalPreviewByToken),
);

// POST /api/v1/public/proposals/accept/:token
proposalsPublicRoutes.post(
  "/accept/:token",
  processRequest({
    body: acceptProposalBodySchema,
    params: getProposalByTokenParamsSchema,
  }),
  asyncHandler(acceptProposalByToken),
);

// POST /api/v1/public/proposals/reject/:token
proposalsPublicRoutes.post(
  "/reject/:token",
  processRequest({
    body: rejectProposalBodySchema,
    params: getProposalByTokenParamsSchema,
  }),
  asyncHandler(rejectProposalByToken),
);
