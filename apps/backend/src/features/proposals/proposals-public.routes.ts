import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  acceptProposalByToken,
  getProposalByToken,
  getProposalPdfByToken,
  rejectProposalByToken,
} from "./proposals-public.controller.js";
import {
  acceptProposalBodySchema,
  getProposalByTokenParamsSchema,
  rejectProposalBodySchema,
} from "./proposals.schemas.js";

/**
 * Public proposal routes (no auth).
 * View proposal by signing token, accept or reject proposal.
 */
export const proposalsPublicRoutes: Router = Router();

// GET /api/v1/public/proposals/accept/:token
proposalsPublicRoutes.get(
  "/proposals/accept/:token",
  processRequest({ params: getProposalByTokenParamsSchema }),
  asyncHandler(getProposalByToken),
);

// GET /api/v1/public/proposals/accept/:token/pdf
proposalsPublicRoutes.get(
  "/proposals/accept/:token/pdf",
  processRequest({ params: getProposalByTokenParamsSchema }),
  asyncHandler(getProposalPdfByToken),
);

// POST /api/v1/public/proposals/accept/:token
proposalsPublicRoutes.post(
  "/proposals/accept/:token",
  processRequest({
    body: acceptProposalBodySchema,
    params: getProposalByTokenParamsSchema,
  }),
  asyncHandler(acceptProposalByToken),
);

// POST /api/v1/public/proposals/reject/:token
proposalsPublicRoutes.post(
  "/proposals/reject/:token",
  processRequest({
    body: rejectProposalBodySchema,
    params: getProposalByTokenParamsSchema,
  }),
  asyncHandler(rejectProposalByToken),
);
