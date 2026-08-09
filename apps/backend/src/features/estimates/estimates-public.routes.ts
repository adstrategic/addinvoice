import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  acceptEstimateByToken,
  getEstimateByToken,
  getEstimatePdfByToken,
  getEstimatePreviewByToken,
  getEstimatePreviewPageByToken,
  rejectEstimateByToken,
} from "./estimates-public.controller.js";
import {
  acceptEstimateBodySchema,
  getEstimateByTokenParamsSchema,
  getEstimatePreviewPageByTokenParamsSchema,
  rejectEstimateBodySchema,
} from "./estimates.schemas.js";
import { previewHashQuerySchema } from "../_shared/preview-schemas.js";

/**
 * Public estimate routes (no auth).
 * View estimate by signing token, accept or reject estimate.
 */
export const estimatesPublicRoutes: Router = Router();

// GET /api/v1/public/estimates/accept/:token
estimatesPublicRoutes.get(
  "/accept/:token",
  processRequest({ params: getEstimateByTokenParamsSchema }),
  asyncHandler(getEstimateByToken),
);

// GET /api/v1/public/estimates/accept/:token/pdf
estimatesPublicRoutes.get(
  "/accept/:token/pdf",
  processRequest({ params: getEstimateByTokenParamsSchema }),
  asyncHandler(getEstimatePdfByToken),
);

// GET /api/v1/public/estimates/accept/:token/preview/:page
estimatesPublicRoutes.get(
  "/accept/:token/preview/:page",
  processRequest({
    params: getEstimatePreviewPageByTokenParamsSchema,
    query: previewHashQuerySchema,
  }),
  asyncHandler(getEstimatePreviewPageByToken),
);

// GET /api/v1/public/estimates/accept/:token/preview
estimatesPublicRoutes.get(
  "/accept/:token/preview",
  processRequest({ params: getEstimateByTokenParamsSchema }),
  asyncHandler(getEstimatePreviewByToken),
);

// POST /api/v1/public/estimates/accept/:token
estimatesPublicRoutes.post(
  "/accept/:token",
  processRequest({
    body: acceptEstimateBodySchema,
    params: getEstimateByTokenParamsSchema,
  }),
  asyncHandler(acceptEstimateByToken),
);

// POST /api/v1/public/estimates/reject/:token
estimatesPublicRoutes.post(
  "/reject/:token",
  processRequest({
    body: rejectEstimateBodySchema,
    params: getEstimateByTokenParamsSchema,
  }),
  asyncHandler(rejectEstimateByToken),
);
