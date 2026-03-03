import type { listMerchantsSchema } from "@addinvoice/schemas";
import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import { createMerchantSchema } from "@addinvoice/schemas";

import { getWorkspaceId } from "../../core/auth.js";
import * as merchantsService from "./merchants.service.js";

/**
 * GET /merchants - List all merchants
 */
export async function listMerchants(
  req: TypedRequest<never, typeof listMerchantsSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { search } = req.query;
  const limit = 10;
  const page = 1;

  const result = await merchantsService.listMerchants(workspaceId, {
    limit,
    page,
    search,
  });

  res.json({
    data: result.merchants,
    pagination: {
      limit: result.limit,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

/**
 * POST /merchants - Create a new merchant
 */
export async function createMerchant(
  req: TypedRequest<never, never, typeof createMerchantSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const body = req.body;
  const merchant = await merchantsService.createMerchant(workspaceId, body);
  res.status(201).json({ data: merchant });
}
