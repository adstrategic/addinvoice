import { Response } from "express";
import * as workspaceService from "./workspace.service";
import type {
  upsertPaymentMethodParamsSchema,
  upsertPaymentMethodSchema,
} from "./workspace.schemas";
import { TypedRequest } from "zod-express-middleware";

/**
 * GET /workspace/payment-methods - List all workspace payment methods
 */
export async function listPaymentMethods(
  req: TypedRequest<any, any, any>,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const methods = await workspaceService.listPaymentMethods(workspaceId);
  res.json({ data: methods });
}

/**
 * PUT /workspace/payment-methods/:type - Upsert a payment method
 */
export async function upsertPaymentMethod(
  req: TypedRequest<
    typeof upsertPaymentMethodParamsSchema,
    any,
    typeof upsertPaymentMethodSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { type } = req.params;
  const body = req.body;
  const method = await workspaceService.upsertPaymentMethod(
    workspaceId,
    type,
    body,
  );
  res.json({ data: method });
}
