import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import type {
  createCatalogSchema,
  getCatalogByIdSchema,
  getCatalogBySequenceSchema,
  updateCatalogSchema,
} from "./catalog.schemas.js";

import { getWorkspaceId } from "../../core/auth.js";
import { listCatalogsSchema } from "./catalog.schemas.js";
import * as catalogService from "./catalog.service.js";

/**
 * POST /catalog - Create a new catalog
 * No error handling needed - middleware handles it
 */
export async function createCatalog(
  req: TypedRequest<never, never, typeof createCatalogSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const body = req.body;

  const catalog = await catalogService.createCatalog(workspaceId, body);

  res.status(201).json({
    data: catalog,
  });
}

/**
 * DELETE /catalog/:id - Delete a catalog (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deleteCatalog(
  req: TypedRequest<typeof getCatalogByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;

  await catalogService.deleteCatalog(workspaceId, id);

  res.status(204).send();
}

/**
 * GET /catalog/:sequence - Get catalog by sequence
 * No error handling needed - middleware handles it
 */
export async function getCatalogBySequence(
  req: TypedRequest<typeof getCatalogBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  const catalog = await catalogService.getCatalogBySequence(
    workspaceId,
    sequence,
  );

  res.json({
    data: catalog,
  });
}

/**
 * GET /catalog - List all catalogs
 * No error handling needed - middleware handles it
 */
export async function listCatalogs(
  req: TypedRequest<never, typeof listCatalogsSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const query = req.query;

  const result = await catalogService.listCatalogs(workspaceId, query);

  res.json({
    data: result.catalogs,
    pagination: {
      limit: result.limit,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

/**
 * PATCH /catalog/:id - Update a catalog
 * No error handling needed - middleware handles it
 */
export async function updateCatalog(
  req: TypedRequest<
    typeof getCatalogByIdSchema,
    never,
    typeof updateCatalogSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;
  const body = req.body;

  const catalog = await catalogService.updateCatalog(workspaceId, id, body);

  res.json({
    data: catalog,
  });
}
