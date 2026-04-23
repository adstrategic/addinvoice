import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages"

import { prisma } from "@addinvoice/db"

import { runAgenticToolLoop } from "../../lib/agentic-runner.js"
import { VOICE_EXTRACTION_MODEL } from "../../lib/anthropic.js"
import * as catalogService from "./catalog.service.js"
import { createCatalogSchema } from "./catalog.schemas.js"

// Re-export so the controller can import from feature-local path.
export { transcribeAudio } from "../../lib/transcribe.js"

const MAX_TOOL_ROUNDS = 4

const CREATE_CATALOG_TOOL: Tool = {
  name: "create_catalog",
  description:
    "Create one catalog item for the selected business. businessId is fixed by the server. Extract a concise name, a clear description, positive price, and quantity unit (UNITS/HOURS/DAYS).",
  input_schema: {
    type: "object",
    properties: {
      businessId: { type: "number" },
      description: { type: "string" },
      name: { type: "string" },
      price: { type: "number" },
      quantityUnit: { enum: ["DAYS", "HOURS", "UNITS"], type: "string" },
    },
    required: ["businessId", "description", "name", "price", "quantityUnit"],
  },
}

function buildSystemPrompt(params: {
  businessId: number
  businessName: string
}): string {
  return `You are a catalog extraction assistant for a B2B invoicing app.
The user provided one transcript to create ONE catalog item.

You must call create_catalog exactly once when you have enough details, then stop.

Business context:
- businessId: ${String(params.businessId)}
- businessName: ${params.businessName}

Rules:
1. Use businessId ${String(params.businessId)} in create_catalog (server enforces this too).
2. name should be short and specific.
3. description should be clear and useful for invoices/estimates.
4. price must be > 0.
5. quantityUnit should be UNITS by default unless user clearly says hours/days.
6. If transcript is vague, infer one sensible catalog item the user can edit later.`
}

async function executeCreateCatalog(
  workspaceId: number,
  businessId: number,
  input: unknown,
): Promise<unknown> {
  const body: Record<string, unknown> = {
    ...(input as Record<string, unknown>),
    businessId,
  }

  const parsed = createCatalogSchema.safeParse(body)
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.format(),
      ok: false,
      validationErrors: parsed.error.flatten(),
    }
  }

  try {
    const catalog = await catalogService.createCatalog(workspaceId, parsed.data)
    return { id: catalog.id, name: catalog.name, ok: true, sequence: catalog.sequence }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), ok: false }
  }
}

function extractCatalogSuccess(
  result: unknown,
): null | { name: string; sequence: number } {
  if (
    typeof result === "object" &&
    result !== null &&
    "ok" in result &&
    (result as { ok: unknown }).ok === true &&
    "name" in result &&
    "sequence" in result
  ) {
    const cast = result as { name: string; sequence: number }
    return { name: cast.name, sequence: cast.sequence }
  }
  return null
}

export type VoiceCatalogResult =
  | { error: "anthropic_unconfigured" }
  | { error: "creation_failed"; message: string }
  | { name: string; sequence: number }

export async function createCatalogFromVoiceTranscript(
  workspaceId: number,
  businessId: number,
  transcript: string,
): Promise<VoiceCatalogResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { error: "anthropic_unconfigured" }
  }

  const business = await prisma.business.findFirst({
    select: { id: true, name: true },
    where: { id: businessId, workspaceId },
  })

  if (!business) {
    return {
      error: "creation_failed",
      message: "Business not found or does not belong to your workspace",
    }
  }

  const system = buildSystemPrompt({
    businessId,
    businessName: business.name,
  })

  const results = await runAgenticToolLoop(
    {
      maxRounds: MAX_TOOL_ROUNDS,
      model: VOICE_EXTRACTION_MODEL,
      system,
      tools: [CREATE_CATALOG_TOOL],
      userMessage: transcript,
    },
    (name, input) => {
      if (name === "create_catalog") {
        return executeCreateCatalog(workspaceId, businessId, input)
      }
      return Promise.resolve({ error: `Unknown tool: ${name}`, ok: false })
    },
  )

  const success = results
    .filter((r) => r.name === "create_catalog")
    .map((r) => extractCatalogSuccess(r.result))
    .find((r) => r !== null)

  if (success) return success

  return {
    error: "creation_failed",
    message:
      "Could not create a catalog item from the transcript. Try describing the item name, description, and price more clearly.",
  }
}
