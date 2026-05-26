import { Router } from "express";

import { estimatesPublicRoutes } from "../features/estimates/estimates-public.routes.js";
import { proposalsPublicRoutes } from "../features/proposals/proposals-public.routes.js";
import { publicDocumentsRoutes } from "../features/public-documents/public-documents.routes.js";

export const publicRouter: Router = Router();

publicRouter.use("/estimates", estimatesPublicRoutes);
publicRouter.use("/proposals", proposalsPublicRoutes);
publicRouter.use("/documents", publicDocumentsRoutes);
