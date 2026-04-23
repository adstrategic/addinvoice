import type { Request, Response } from "express";
import type { TypedRequest } from "zod-express-middleware";

import type {
  createCatalogSchema,
  getCatalogByIdSchema,
  getCatalogBySequenceSchema,
  updateCatalogSchema,
} from "./catalog.schemas.js";

import { getWorkspaceId } from "../../core/auth.js";
import {
  fromVoiceAudioBodySchema as fromVoiceAudioBodySchemaValue,
  listCatalogsSchema,
} from "./catalog.schemas.js";
import * as catalogService from "./catalog.service.js";
import {
  createCatalogFromVoiceTranscript as createCatalogFromVoiceTranscriptFlow,
  transcribeAudio,
} from "./voice-catalog-claude.service.js";

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
 * POST /catalog/from-voice-audio — audio blob → Whisper transcript → Claude tools → catalog item
 */
export async function createCatalogFromVoiceAudio(
  req: Request,
  res: Response,
): Promise<void> {
  const workspaceId = getWorkspaceId(req);

  const parsed = fromVoiceAudioBodySchemaValue.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten().fieldErrors });
    return;
  }
  const { businessId } = parsed.data;

  if (!req.file) {
    res.status(400).json({ error: "Audio file is required" });
    return;
  }

  if (!process.env.OPENAI_API_KEY?.trim()) {
    res.status(503).json({
      error: "Voice catalog requires OPENAI_API_KEY to be configured.",
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

  const result = await createCatalogFromVoiceTranscriptFlow(
    workspaceId,
    businessId,
    transcript,
  );

  if ("error" in result) {
    if (result.error === "anthropic_unconfigured") {
      res.status(503).json({
        error: "Voice catalog requires ANTHROPIC_API_KEY to be configured.",
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
