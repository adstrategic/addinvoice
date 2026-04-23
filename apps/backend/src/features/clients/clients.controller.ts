import type { Request, Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import type {
  createClientSchema,
  getClientByIdSchema,
  getClientBySequenceSchema,
  updateClientSchema,
} from "./clients.schemas.js";

import { getWorkspaceId } from "../../core/auth.js";
import {
  fromVoiceAudioBodySchema,
  listClientsSchema,
} from "./clients.schemas.js";
import * as clientsService from "./clients.service.js";
import {
  createClientFromVoiceTranscript as createClientFromVoiceTranscriptFlow,
  transcribeAudio,
} from "./voice-clients-claude.service.js";

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
 * POST /clients/from-voice-audio — audio blob → Whisper transcript → Claude tools → client
 */
export async function createClientFromVoiceAudio(
  req: Request,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);

  const parsed = fromVoiceAudioBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "Audio file is required" });
    return;
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    res.status(503).json({
      error: "Voice client requires OPENAI_API_KEY to be configured.",
    });
    return;
  }

  const transcript = await transcribeAudio(req.file.buffer, req.file.mimetype);
  if (!transcript || transcript.trim().length < 8) {
    res.status(400).json({
      error: "Could not transcribe audio, or the recording was too short.",
    });
    return;
  }

  const result = await createClientFromVoiceTranscriptFlow(
    workspaceId,
    transcript,
  );

  if ("error" in result) {
    if (result.error === "anthropic_unconfigured") {
      res.status(503).json({
        error: "Voice client requires ANTHROPIC_API_KEY to be configured.",
      });
      return;
    }
    res.status(400).json({ error: result.message });
    return;
  }

  res.status(201).json({
    data: {
      name: result.name,
      sequence: result.sequence,
    },
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
