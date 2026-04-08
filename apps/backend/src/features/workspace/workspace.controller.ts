import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import type {
  upsertPaymentMethodParamsSchema,
  upsertPaymentMethodSchema,
  upsertOnboardingSchema,
  upsertWorkspaceLanguageSchema,
} from "./workspace.schemas.js";

import { ConflictError } from "../../errors/EntityErrors.js";
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

/**
 * GET /workspace/onboarding - Get onboarding status for current workspace
 */
export async function getOnboarding(
  req: TypedRequest<never, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const onboarding = await workspaceService.getOnboarding(workspaceId);

  res.json({
    data: {
      completedAt: onboarding.completedAt,
      answers: onboarding.answers,
    },
  });
}

/**
 * POST /workspace/onboarding - Complete onboarding for current workspace (one-time)
 */
export async function completeOnboarding(
  req: TypedRequest<never, never, typeof upsertOnboardingSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);

  try {
    const result = await workspaceService.completeOnboarding(
      workspaceId,
      req.body,
    );

    res.status(201).json({
      data: {
        completedAt: result.completedAt,
        answers: result.answers,
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Onboarding already completed") {
      throw new ConflictError("Onboarding already completed");
    }
    throw error;
  }
}

/**
 * GET /workspace/language
 */
export async function getWorkspaceLanguage(
  req: TypedRequest<never, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { language } = await workspaceService.getWorkspaceLanguage(workspaceId);

  res.json({
    data: { language },
  });
}

/**
 * PUT /workspace/language
 */
export async function updateWorkspaceLanguage(
  req: TypedRequest<
    never,
    never,
    typeof upsertWorkspaceLanguageSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const body = req.body;

  const { language } = await workspaceService.updateWorkspaceLanguage(
    workspaceId,
    body,
  );

  res.json({
    data: { language },
  });
}
