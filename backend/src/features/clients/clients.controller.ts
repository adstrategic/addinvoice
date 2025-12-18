import { Response } from "express";
import * as clientsService from "./clients.service";
import type {
  getClientBySequenceSchema,
  createClientSchema,
  updateClientSchema,
  getClientByIdSchema,
} from "./clients.schemas";
import { TypedRequest } from "zod-express-middleware";
import { listClientsSchema } from "./clients.schemas";

/**
 * GET /clients - List all clients
 * No error handling needed - middleware handles it
 */
export async function listClients(
  req: TypedRequest<any, typeof listClientsSchema, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const query = req.query;

  const result = await clientsService.listClients(workspaceId, query);

  res.json({
    success: true,
    data: result.clients,
    pagination: {
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    },
  });
}

/**
 * GET /clients/:sequence - Get client by sequence
 * No error handling needed - middleware handles it
 */
export async function getClientBySequence(
  req: TypedRequest<typeof getClientBySequenceSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { sequence } = req.params;

  const client = await clientsService.getClientBySequence(
    workspaceId,
    sequence
  );

  res.json({
    success: true,
    data: client,
  });
}

/**
 * POST /clients - Create a new client
 * No error handling needed - middleware handles it
 */
export async function createClient(
  req: TypedRequest<any, any, typeof createClientSchema>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const body = req.body;

  const client = await clientsService.createClient(workspaceId, body);

  res.status(201).json({
    success: true,
    data: client,
  });
}

/**
 * PATCH /clients/:id - Update a client
 * No error handling needed - middleware handles it
 */
export async function updateClient(
  req: TypedRequest<typeof getClientByIdSchema, any, typeof updateClientSchema>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { id } = req.params;
  const body = req.body;

  const client = await clientsService.updateClient(workspaceId, id, body);

  res.json({
    success: true,
    data: client,
  });
}

/**
 * DELETE /clients/:id - Delete a client (soft delete)
 * No error handling needed - middleware handles it
 */
export async function deleteClient(
  req: TypedRequest<typeof getClientByIdSchema, any, any>,
  res: Response
): Promise<void> {
  const workspaceId = req.workspaceId!;
  const { id } = req.params;

  await clientsService.deleteClient(workspaceId, id);

  res.json({
    success: true,
    message: "Client deleted successfully",
  });
}
