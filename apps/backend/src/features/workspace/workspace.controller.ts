import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import type {
  upsertPaymentMethodParamsSchema,
  upsertPaymentMethodSchema,
} from "./workspace.schemas.js";

import { getWorkspaceId } from "../../core/auth.js";
import * as workspaceService from "./workspace.service.js";

/**
 * GET /workspace/payment-methods - List all workspace payment methods
 */
export async function listPaymentMethods(
  req: TypedRequest<never, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const methods = await workspaceService.listPaymentMethods(workspaceId);
  res.json({ data: methods });
}

/**
 * PUT /workspace/payment-methods/:type - Upsert a payment method
 */
export async function upsertPaymentMethod(
  req: TypedRequest<
    typeof upsertPaymentMethodParamsSchema,
    never,
    typeof upsertPaymentMethodSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { type } = req.params;
  const body = req.body;
  const method = await workspaceService.upsertPaymentMethod(
    workspaceId,
    type,
    body,
  );
  res.json({ data: method });
}
