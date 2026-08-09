import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import { previewHashQuerySchema } from "../_shared/preview-schemas.js";
import {
  getPublicDocument,
  getPublicDocumentPdf,
  getPublicDocumentPreview,
  getPublicDocumentPreviewPage,
  markPublicDocumentViewedHandler,
} from "./public-documents.controller.js";
import {
  publicDocumentPreviewPageParamsSchema,
  publicDocumentSlugParamsSchema,
} from "./public-documents.schemas.js";

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

// GET /api/v1/public/documents/:slug/preview/:page
publicDocumentsRoutes.get(
  "/:slug/preview/:page",
  processRequest({
    params: publicDocumentPreviewPageParamsSchema,
    query: previewHashQuerySchema,
  }),
  asyncHandler(getPublicDocumentPreviewPage),
);

// GET /api/v1/public/documents/:slug/preview
publicDocumentsRoutes.get(
  "/:slug/preview",
  processRequest({ params: publicDocumentSlugParamsSchema }),
  asyncHandler(getPublicDocumentPreview),
);

// POST /api/v1/public/documents/:slug/view
publicDocumentsRoutes.post(
  "/:slug/view",
  processRequest({ params: publicDocumentSlugParamsSchema }),
  asyncHandler(markPublicDocumentViewedHandler),
);
