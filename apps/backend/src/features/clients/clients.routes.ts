import { Router } from "express";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import {
  createClient,
  deleteClient,
  getClientBySequence,
  listClients,
  updateClient,
} from "./clients.controller.js";
import {
  createClientSchema,
  getClientByIdSchema,
  getClientBySequenceSchema,
  listClientsSchema,
  updateClientSchema,
} from "./clients.schemas.js";

/**
 * Clients routes
 * All routes are protected by requireAuth() and verifyWorkspaceAccess middleware
 * (applied in routes/index.ts)
 */
export const clientsRoutes: Router = Router();

// GET /api/v1/clients - List all clients
clientsRoutes.get(
  "/",
  processRequest({ query: listClientsSchema }),
  asyncHandler(listClients),
);

// GET /api/v1/clients/:sequence - Get client by sequence
clientsRoutes.get(
  "/:sequence",
  processRequest({ params: getClientBySequenceSchema }),
  asyncHandler(getClientBySequence),
);

// POST /api/v1/clients - Create a new client
clientsRoutes.post(
  "/",
  processRequest({ body: createClientSchema }),
  asyncHandler(createClient),
);

// PATCH /api/v1/clients/:id - Update a client
clientsRoutes.patch(
  "/:id",
  processRequest({
    body: updateClientSchema,
    params: getClientByIdSchema,
  }),
  asyncHandler(updateClient),
);

// DELETE /api/v1/clients/:id - Delete a client (soft delete)
clientsRoutes.delete(
  "/:id",
  processRequest({ params: getClientByIdSchema }),
  asyncHandler(deleteClient),
);
