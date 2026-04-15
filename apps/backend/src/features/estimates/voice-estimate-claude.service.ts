import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages"

import { prisma } from "@addinvoice/db"
import { createEstimateSchema } from "@addinvoice/schemas"

import { runAgenticToolLoop } from "../../lib/agentic-runner.js"
import { VOICE_EXTRACTION_MODEL } from "../../lib/anthropic.js"
import * as estimatesService from "./estimates.service.js"

// Re-export so the controller keeps a feature-local import path.
export { transcribeAudio } from "../../lib/transcribe.js"

const MAX_TOOL_ROUNDS = 4

const CREATE_ESTIMATE_TOOL: Tool = {
  name: "create_estimate",
  description:
    "Create a DRAFT estimate for the customer already selected in the app. businessId and customer (clientId, clientEmail, createClient) are fixed by the server. Use suggestedNextEstimateNumber unless the user explicitly requested another number. Default taxMode to NONE unless user clearly asks for tax. Dates should be YYYY-MM-DD.",
  input_schema: {
    type: "object",
    properties: {
      createClient: { type: "boolean" },
      clientId: { type: "number" },
      clientEmail: { type: "string" },
      estimateNumber: { type: "string" },
      timelineStartDate: {
        description: "YYYY-MM-DD",
        type: ["string", "null"],
      },
      timelineEndDate: {
        description: "YYYY-MM-DD",
        type: ["string", "null"],
      },
      currency: { type: "string" },
      taxMode: { type: "string", enum: ["NONE", "BY_PRODUCT", "BY_TOTAL"] },
      taxName: { type: ["string", "null"] },
      taxPercentage: { type: ["number", "null"] },
      summary: { type: ["string", "null"] },
      notes: { type: ["string", "null"] },
      terms: { type: ["string", "null"] },
      discount: { type: "number" },
      discountType: { type: "string", enum: ["NONE", "PERCENTAGE", "FIXED"] },
      clientAddress: { type: ["string", "null"] },
      clientPhone: { type: ["string", "null"] },
      items: {
        type: "array",
        items: {
          type: "object",
          properties: {
            name: { type: "string" },
            description: { type: "string" },
            quantity: { type: "number" },
            unitPrice: { type: "number" },
            quantityUnit: { type: "string", enum: ["DAYS", "HOURS", "UNITS"] },
            discount: { type: "number" },
            discountType: {
              type: "string",
              enum: ["NONE", "PERCENTAGE", "FIXED"],
            },
            tax: { type: "number" },
            vatEnabled: { type: "boolean" },
          },
          required: ["name", "description", "quantity", "unitPrice"],
        },
      },
    },
    required: [
      "createClient",
      "clientId",
      "clientEmail",
      "estimateNumber",
      "currency",
      "taxMode",
      "discount",
      "discountType",
      "items",
    ],
  },
}

interface LockedClient {
  email: string
  id: number
  name: string
}

function buildSystemPrompt(params: {
  businessId: number
  businessName: string
  lockedClient: LockedClient
  suggestedNextEstimateNumber: string
  todayIso: string
}): string {
  return `You are an estimate extraction assistant for a B2B estimate app. The user provided one transcript with estimate details. The customer is already selected in the app and must not be changed.

You must call create_estimate exactly once when you have enough details, then stop.

Fixed customer (server enforces this on save):
- clientId: ${String(params.lockedClient.id)}
- clientEmail: ${params.lockedClient.email}
- customer display name (context only): ${params.lockedClient.name}

Business context:
- businessId: ${String(params.businessId)}
- businessName: ${params.businessName}
- suggestedNextEstimateNumber: ${params.suggestedNextEstimateNumber}
- today: ${params.todayIso}

Rules:
1. Set createClient to false, clientId to ${String(params.lockedClient.id)}, and clientEmail to "${params.lockedClient.email}".
2. Use suggestedNextEstimateNumber unless the user clearly gave a different estimate number.
3. taxMode defaults to NONE unless the user explicitly asked for taxes.
4. timelineStartDate and timelineEndDate are optional. If omitted, keep them null.
5. Every line item must include name, description, quantity > 0, unitPrice > 0; quantityUnit defaults to UNITS.
6. If transcript is vague, infer one reasonable item so the user can edit later.

Extract item and amount details from transcript only.`
}

async function executeCreateEstimate(
  workspaceId: number,
  businessId: number,
  lockedClient: LockedClient,
  input: unknown,
): Promise<unknown> {
  const body: Record<string, unknown> = {
    ...(input as Record<string, unknown>),
    businessId,
    clientEmail: lockedClient.email,
    clientId: lockedClient.id,
    createClient: false,
  }

  const parsed = createEstimateSchema.safeParse(body)
  if (!parsed.success) {
    console.error(
      "[voice-estimate] schema validation failed:",
      JSON.stringify(parsed.error.flatten()),
    )
    return {
      fieldErrors: parsed.error.format(),
      ok: false,
      validationErrors: parsed.error.flatten(),
    }
  }

  try {
    const estimate = await estimatesService.createEstimate(workspaceId, parsed.data)
    return {
      estimateNumber: estimate.estimateNumber,
      id: estimate.id,
      ok: true,
      sequence: estimate.sequence,
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), ok: false }
  }
}

function extractEstimateSuccess(
  result: unknown,
): null | { estimateNumber: string; sequence: number } {
  if (
    typeof result === "object" &&
    result !== null &&
    "ok" in result &&
    (result as { ok: unknown }).ok === true &&
    "estimateNumber" in result &&
    "sequence" in result
  ) {
    const cast = result as { estimateNumber: string; sequence: number }
    return { estimateNumber: cast.estimateNumber, sequence: cast.sequence }
  }
  return null
}

export type VoiceEstimateResult =
  | { error: "anthropic_unconfigured" }
  | { error: "creation_failed"; message: string }
  | { estimateNumber: string; sequence: number }

export async function createEstimateFromVoiceTranscript(
  workspaceId: number,
  businessId: number,
  clientId: number,
  transcript: string,
): Promise<VoiceEstimateResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { error: "anthropic_unconfigured" }
  }

  const [business, clientRow] = await Promise.all([
    prisma.business.findFirst({
      select: { id: true, name: true },
      where: { id: businessId, workspaceId },
    }),
    prisma.client.findFirst({
      select: { email: true, id: true, name: true },
      where: { id: clientId, workspaceId },
    }),
  ])

  if (!business) {
    return {
      error: "creation_failed",
      message: "Business not found or does not belong to your workspace",
    }
  }

  if (!clientRow) {
    return {
      error: "creation_failed",
      message: "Client not found or does not belong to your workspace",
    }
  }

  const suggestedNextEstimateNumber =
    await estimatesService.getNextEstimateNumberForWorkspace(workspaceId, businessId)
  const todayIso = new Date().toISOString().slice(0, 10)
  const lockedClient: LockedClient = {
    email: clientRow.email,
    id: clientRow.id,
    name: clientRow.name,
  }
  const system = buildSystemPrompt({
    businessId,
    businessName: business.name,
    lockedClient,
    suggestedNextEstimateNumber,
    todayIso,
  })

  console.info("[voice-estimate] starting", {
    businessId,
    clientId,
    transcriptLength: transcript.length,
  })

  const results = await runAgenticToolLoop(
    {
      maxRounds: MAX_TOOL_ROUNDS,
      model: VOICE_EXTRACTION_MODEL,
      system,
      tools: [CREATE_ESTIMATE_TOOL],
      userMessage: transcript,
    },
    (name, input) => {
      if (name === "create_estimate") {
        return executeCreateEstimate(workspaceId, businessId, lockedClient, input)
      }
      return Promise.resolve({ error: `Unknown tool: ${name}`, ok: false })
    },
  )

  const successResult = results
    .filter((r) => r.name === "create_estimate")
    .map((r) => extractEstimateSuccess(r.result))
    .find((r) => r !== null)

  if (successResult) {
    return successResult
  }

  return {
    error: "creation_failed",
    message:
      "Could not create an estimate from the transcript. Try describing items, quantities, and amounts more clearly.",
  }
}
