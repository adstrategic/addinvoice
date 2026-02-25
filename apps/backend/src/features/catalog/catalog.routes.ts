import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  createCatalog,
  deleteCatalog,
  getCatalogBySequence,
  listCatalogs,
  updateCatalog,
} from "./catalog.controller.js";
import {
  createCatalogSchema,
  getCatalogByIdSchema,
  getCatalogBySequenceSchema,
  listCatalogsSchema,
  updateCatalogSchema,
} from "./catalog.schemas.js";

/**
 * Catalog routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const catalogRoutes: Router = Router();

// GET /api/v1/catalog - List all catalogs
catalogRoutes.get(
  "/",
  processRequest({ query: listCatalogsSchema }),
  asyncHandler(listCatalogs),
);

// GET /api/v1/catalog/:sequence - Get catalog by sequence
catalogRoutes.get(
  "/:sequence",
  processRequest({ params: getCatalogBySequenceSchema }),
  asyncHandler(getCatalogBySequence),
);

// POST /api/v1/catalog - Create a new catalog
catalogRoutes.post(
  "/",
  processRequest({ body: createCatalogSchema }),
  asyncHandler(createCatalog),
);

// PATCH /api/v1/catalog/:id - Update a catalog
catalogRoutes.patch(
  "/:id",
  processRequest({
    body: updateCatalogSchema,
    params: getCatalogByIdSchema,
  }),
  asyncHandler(updateCatalog),
);

// DELETE /api/v1/catalog/:id - Delete a catalog (soft delete)
catalogRoutes.delete(
  "/:id",
  processRequest({ params: getCatalogByIdSchema }),
  asyncHandler(deleteCatalog),
);
