import { listPendingAdvancesByClientSchema } from "@addinvoice/schemas";
import { Router } from "express";
import multer from "multer";
import { processRequest } from "zod-express-middleware";

import asyncHandler from "../../core/async-handler.js";
import { listPendingAdvancesByClient } from "../advances/advances.controller.js";
import {
  createClient,
  createClientFromVoiceAudio,
  deleteClient,
  getClientBySequence,
  listClients,
  updateClient,
} from "./clients.controller.js";
import {
  createClientSchema,
  fromVoiceAudioBodySchema,
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

const audioUpload = multer({
  limits: { fileSize: 10 * 1024 * 1024 },
  storage: multer.memoryStorage(),
  fileFilter: (_req, file, cb) => {
    const base = file.mimetype.split(";")[0]?.trim() ?? "";
    cb(null, base.startsWith("audio/"));
  },
});

// POST /api/v1/clients/from-voice-audio — audio blob → Whisper → Claude → client
clientsRoutes.post(
  "/from-voice-audio",
  audioUpload.single("audio") as never,
  processRequest({ body: fromVoiceAudioBodySchema }),
  asyncHandler(createClientFromVoiceAudio),
);

// GET /api/v1/clients - List all clients
clientsRoutes.get(
  "/",
  processRequest({ query: listClientsSchema }),
  asyncHandler(listClients),
);

// GET /api/v1/clients/:clientId/pending-advances
clientsRoutes.get(
  "/:clientId/pending-advances",
  processRequest({ params: listPendingAdvancesByClientSchema }),
  asyncHandler(listPendingAdvancesByClient),
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
