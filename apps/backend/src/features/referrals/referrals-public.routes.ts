import { getReferralByCodeSchema } from "@addinvoice/schemas";
import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import { getReferralByCode } from "./referrals.controller.js";

/**
 * Public referral routes — no auth. Used by the /r/:code landing route to
 * resolve a code to a referrer name before the visitor has an account.
 */
export const referralsPublicRoutes: Router = Router();

referralsPublicRoutes.get(
  "/:code",
  processRequest({ params: getReferralByCodeSchema }),
  asyncHandler(getReferralByCode),
);
