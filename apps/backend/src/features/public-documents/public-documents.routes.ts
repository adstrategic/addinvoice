import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  getPublicDocument,
  getPublicDocumentPdf,
  markPublicDocumentViewedHandler,
} from "./public-documents.controller.js";
import { publicDocumentSlugParamsSchema } from "./public-documents.schemas.js";

export const publicDocumentsRoutes: Router = Router();

// GET /api/v1/public/documents/:slug
publicDocumentsRoutes.get(
  "/:slug",
  processRequest({ params: publicDocumentSlugParamsSchema }),
  asyncHandler(getPublicDocument),
);

// GET /api/v1/public/documents/:slug/pdf
publicDocumentsRoutes.get(
  "/:slug/pdf",
  processRequest({ params: publicDocumentSlugParamsSchema }),
  asyncHandler(getPublicDocumentPdf),
);

// POST /api/v1/public/documents/:slug/view
publicDocumentsRoutes.post(
  "/:slug/view",
  processRequest({ params: publicDocumentSlugParamsSchema }),
  asyncHandler(markPublicDocumentViewedHandler),
);
