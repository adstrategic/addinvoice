import type {
  attachReferralSchema,
  getReferralByCodeSchema,
  getReferrerByIdSchema,
} from "@addinvoice/schemas";
import type { Request, Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import { getAuth } from "@clerk/express";

import { getWorkspaceId } from "../../core/auth.js";
import * as referralsService from "./referrals.service.js";

/**
 * GET /public/referrals/:code — validate a referral code for the landing page.
 *
 * Always 200. An unknown, paused or malformed code returns { valid: false } so
 * the link still lands the visitor on signup; a broken code must never cost a
 * signup.
 */
export async function getReferralByCode(
  req: TypedRequest<typeof getReferralByCodeSchema, never, never>,
  res: Response,
): Promise<void> {
  const { code } = req.params;

  const referrer = await referralsService.findActiveReferrerByCode(code);

  if (!referrer) {
    res.json({ data: { valid: false } });
    return;
  }

  res.json({
    data: {
      code: referrer.code,
      referrerName: referrer.name,
      valid: true,
    },
  });
}

/**
 * GET /referrals/me — the referral attached to the caller's workspace.
 */
export async function getMyReferral(
  req: Request,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);

  const referral = await referralsService.getReferralForWorkspace(workspaceId);

  res.json({ data: referral });
}

/**
 * POST /referrals/attach — attach a referral code to the caller's workspace.
 */
export async function attachReferral(
  req: TypedRequest<never, never, typeof attachReferralSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { code } = req.body;

  const auth = getAuth(req);
  const sessionClaims = auth.sessionClaims as undefined | { email?: string };
  const userEmail = sessionClaims?.email ?? "";

  const referral = await referralsService.attachReferral(
    workspaceId,
    code,
    userEmail,
  );

  res.json({ data: referral });
}

/**
 * DELETE /referrals/me — drop a not-yet-converted referral.
 */
export async function detachReferral(
  req: Request,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);

  await referralsService.detachReferral(workspaceId);

  res.json({ data: null });
}

/**
 * GET /admin/referrals/referrers — all referrers with totals.
 */
export async function listReferrers(
  req: Request,
  res: Response,
): Promise<void> {
  const referrers = await referralsService.listReferrersWithTotals();

  res.json({ data: referrers });
}

/**
 * GET /admin/referrals/referrers/:id — one referrer with referrals and ledger.
 */
export async function getReferrer(
  req: TypedRequest<typeof getReferrerByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const { id } = req.params;

  const referrer = await referralsService.getReferrerDetail(id);

  res.json({ data: referrer });
}
