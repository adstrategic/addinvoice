import type {
  createWorkCategorySchema,
  listWorkCategoriesSchema,
} from "@addinvoice/schemas";
import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import { getWorkspaceId } from "../../core/auth.js";
import * as workCategoriesService from "./work-categories.service.js";

/**
 * GET /work-categories - List work categories with search and pagination
 */
export async function listWorkCategories(
  req: TypedRequest<never, typeof listWorkCategoriesSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const result = await workCategoriesService.listWorkCategories(
    workspaceId,
    req.query,
  );
  res.json({
    data: result.categories,
    pagination: {
      limit: result.limit,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

/**
 * POST /work-categories - Create a new work category
 */
export async function createWorkCategory(
  req: TypedRequest<never, never, typeof createWorkCategorySchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const body = req.body;
  const category = await workCategoriesService.createWorkCategory(
    workspaceId,
    body,
  );
  res.status(201).json({ data: category });
}
