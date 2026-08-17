import { attachReferralSchema } from "@addinvoice/schemas";
import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  attachReferral,
  detachReferral,
  getMyReferral,
} from "./referrals.controller.js";

/**
 * Authenticated referral routes.
 *
 * Protected by requireAuth() and verifyWorkspaceAccess in routes/index.ts, and
 * deliberately exempted from requireSubscription there: these are called before
 * the user has any plan, which is the whole point.
 */
export const referralsRoutes: Router = Router();

referralsRoutes.get("/me", asyncHandler(getMyReferral));

referralsRoutes.post(
  "/attach",
  processRequest({ body: attachReferralSchema }),
  asyncHandler(attachReferral),
);

referralsRoutes.delete("/me", asyncHandler(detachReferral));
