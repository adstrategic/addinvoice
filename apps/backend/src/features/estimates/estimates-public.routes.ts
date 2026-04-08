import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  acceptEstimateByToken,
  getEstimateByToken,
  rejectEstimateByToken,
} from "./estimates-public.controller.js";
import {
  acceptEstimateBodySchema,
  getEstimateByTokenParamsSchema,
  rejectEstimateBodySchema,
} from "./estimates.schemas.js";

/**
 * Public estimate routes (no auth).
 * View estimate by signing token, accept or reject estimate.
 */
export const estimatesPublicRoutes: Router = Router();

// GET /api/v1/public/estimates/accept/:token
estimatesPublicRoutes.get(
  "/estimates/accept/:token",
  processRequest({ params: getEstimateByTokenParamsSchema }),
  asyncHandler(getEstimateByToken),
);

// POST /api/v1/public/estimates/accept/:token
estimatesPublicRoutes.post(
  "/estimates/accept/:token",
  processRequest({
    body: acceptEstimateBodySchema,
    params: getEstimateByTokenParamsSchema,
  }),
  asyncHandler(acceptEstimateByToken),
);

// POST /api/v1/public/estimates/reject/:token
estimatesPublicRoutes.post(
  "/estimates/reject/:token",
  processRequest({
    body: rejectEstimateBodySchema,
    params: getEstimateByTokenParamsSchema,
  }),
  asyncHandler(rejectEstimateByToken),
);
