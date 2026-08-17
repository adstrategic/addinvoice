import { getReferrerByIdSchema } from "@addinvoice/schemas";
import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import { requireAdmin } from "../../core/admin-guard.js";
import asyncHandler from "../../core/async-handler.js";
import { getReferrer, listReferrers } from "./referrals.controller.js";

/**
 * Read-only admin views over the referral program.
 *
 * Referrers are created and payouts recorded by the scripts in
 * apps/backend/scripts — deliberately not exposed as endpoints while there are
 * only a couple of referrers to manage.
 */
export const referralsAdminRoutes: Router = Router();

referralsAdminRoutes.use(requireAdmin);

referralsAdminRoutes.get("/referrers", asyncHandler(listReferrers));

referralsAdminRoutes.get(
  "/referrers/:id",
  processRequest({ params: getReferrerByIdSchema }),
  asyncHandler(getReferrer),
);
