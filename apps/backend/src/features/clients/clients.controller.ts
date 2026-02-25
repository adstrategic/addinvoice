import type { Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import type {
  createClientSchema,
  getClientByIdSchema,
  getClientBySequenceSchema,
  updateClientSchema,
} from "./clients.schemas.js";

import { getWorkspaceId } from "../../core/auth.js";
import { listClientsSchema } from "./clients.schemas.js";
import * as clientsService from "./clients.service.js";

/**
 * POST /clients - Create a new client
 * No error handling needed - middleware handles it
 */
export async function createClient(
  req: TypedRequest<never, never, typeof createClientSchema>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const body = req.body;

  const client = await clientsService.createClient(workspaceId, body);

  res.status(201).json({
    data: client,
  });
}

/**
 * DELETE /clients/:id - Delete a client (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deleteClient(
  req: TypedRequest<typeof getClientByIdSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;

  await clientsService.deleteClient(workspaceId, id);

  res.status(204).send();
}

/**
 * GET /clients/:sequence - Get client by sequence
 * No error handling needed - middleware handles it
 */
export async function getClientBySequence(
  req: TypedRequest<typeof getClientBySequenceSchema, never, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { sequence } = req.params;

  const client = await clientsService.getClientBySequence(
    workspaceId,
    sequence,
  );

  res.json({
    data: client,
  });
}

/**
 * GET /clients - List all clients
 * No error handling needed - middleware handles it
 */
export async function listClients(
  req: TypedRequest<never, typeof listClientsSchema, never>,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const query = req.query;

  const result = await clientsService.listClients(workspaceId, query);

  res.json({
    data: result.clients,
    pagination: {
      limit: result.limit,
      page: result.page,
      total: result.total,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

/**
 * PATCH /clients/:id - Update a client
 * No error handling needed - middleware handles it
 */
export async function updateClient(
  req: TypedRequest<
    typeof getClientByIdSchema,
    never,
    typeof updateClientSchema
  >,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);
  const { id } = req.params;
  const body = req.body;

  const client = await clientsService.updateClient(workspaceId, id, body);

  res.json({
    data: client,
  });
}
