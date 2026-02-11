import { Response } from "express";
import * as catalogService from "./catalog.service";
import type {
  getCatalogBySequenceSchema,
  createCatalogSchema,
  updateCatalogSchema,
  getCatalogByIdSchema,
} from "./catalog.schemas";
import { TypedRequest } from "zod-express-middleware";
import { listCatalogsSchema } from "./catalog.schemas";

/**
 * GET /catalog - List all catalogs
 * No error handling needed - middleware handles it
 */
export async function listCatalogs(
  req: TypedRequest<any, typeof listCatalogsSchema, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const query = req.query;

  const result = await catalogService.listCatalogs(workspaceId, query);

  res.json({
    data: result.catalogs,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

/**
 * GET /catalog/:sequence - Get catalog by sequence
 * No error handling needed - middleware handles it
 */
export async function getCatalogBySequence(
  req: TypedRequest<typeof getCatalogBySequenceSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { sequence } = req.params;

  const catalog = await catalogService.getCatalogBySequence(
    workspaceId,
    sequence
  );

  res.json({
    data: catalog,
  });
}

/**
 * POST /catalog - Create a new catalog
 * No error handling needed - middleware handles it
 */
export async function createCatalog(
  req: TypedRequest<any, any, typeof createCatalogSchema>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const body = req.body;

  const catalog = await catalogService.createCatalog(workspaceId, body);

  res.status(201).json({
    data: catalog,
  });
}

/**
 * PATCH /catalog/:id - Update a catalog
 * No error handling needed - middleware handles it
 */
export async function updateCatalog(
  req: TypedRequest<
    typeof getCatalogByIdSchema,
    any,
    typeof updateCatalogSchema
  >,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { id } = req.params;
  const body = req.body;

  const catalog = await catalogService.updateCatalog(workspaceId, id, body);

  res.json({
    data: catalog,
  });
}

/**
 * DELETE /catalog/:id - Delete a catalog (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deleteCatalog(
  req: TypedRequest<typeof getCatalogByIdSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { id } = req.params;

  await catalogService.deleteCatalog(workspaceId, id);

  res.status(204).send();
}
