import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import {
  acceptEstimateBodySchema,
  getEstimateByTokenParamsSchema,
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
