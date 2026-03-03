import { createMerchantSchema, listMerchantsSchema } from "@addinvoice/schemas";
import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import { createMerchant, listMerchants } from "./merchants.controller.js";

/**
 * Merchants routes
 */
export const merchantsRoutes: Router = Router();

merchantsRoutes.get(
  "/",
  processRequest({ query: listMerchantsSchema }),
  asyncHandler(listMerchants),
);

merchantsRoutes.post(
  "/",
  processRequest({ body: createMerchantSchema }),
  asyncHandler(createMerchant),
);
