import { Router } from "express";
import { processRequest } from "zod-express-middleware";
import {
  listClients,
  getClientBySequence,
  createClient,
  updateClient,
  deleteClient,
} from "./clients.controller";
import {
  listClientsSchema,
  getClientBySequenceSchema,
  createClientSchema,
  updateClientSchema,
  getClientByIdSchema,
} from "./clients.schemas";
import asyncHandler from "../../core/async-handler";

/**
 * Clients routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const clientsRoutes = Router();

// GET /api/v1/clients - List all clients
clientsRoutes.get(
  "/",
  processRequest({ query: listClientsSchema }),
  asyncHandler(listClients)
);

// GET /api/v1/clients/:sequence - Get client by sequence
clientsRoutes.get(
  "/:sequence",
  processRequest({ params: getClientBySequenceSchema }),
  asyncHandler(getClientBySequence)
);

// POST /api/v1/clients - Create a new client
clientsRoutes.post(
  "/",
  processRequest({ body: createClientSchema }),
  asyncHandler(createClient)
);

// PATCH /api/v1/clients/:id - Update a client
clientsRoutes.patch(
  "/:id",
  processRequest({
    params: getClientByIdSchema,
    body: updateClientSchema,
  }),
  asyncHandler(updateClient)
);

// DELETE /api/v1/clients/:id - Delete a client (soft delete)
clientsRoutes.delete(
  "/:id",
  processRequest({ params: getClientByIdSchema }),
  asyncHandler(deleteClient)
);
