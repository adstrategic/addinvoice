import type { Tool } from "@anthropic-ai/sdk/resources/messages/messages";

import { runAgenticToolLoop } from "../../lib/agentic-runner.js";
import { VOICE_EXTRACTION_MODEL } from "../../lib/anthropic.js";
import { createClientSchema } from "./clients.schemas.js";
import * as clientsService from "./clients.service.js";

// Re-export so the controller can import from feature-local path.
export { transcribeAudio } from "../../lib/transcribe.js";

const MAX_TOOL_ROUNDS = 4;

const CREATE_CLIENT_TOOL: Tool = {
  name: "create_client",
  description:
    "Create one client for the workspace from the user's spoken description. Required: name and email. Phone must be international format starting with + (e.g. +573011234567). Omit phone if unknown. Optional: address, nit, businessName, reminderBeforeDueIntervalDays, reminderAfterDueIntervalDays (positive integers only if user clearly asked for reminders).",
  input_schema: {
    type: "object",
    properties: {
      name: { type: "string" },
      email: { type: "string" },
      phone: { type: ["string", "null"] },
      address: { type: ["string", "null"] },
      nit: { type: ["string", "null"] },
      businessName: { type: ["string", "null"] },
      reminderBeforeDueIntervalDays: { type: ["integer", "null"] },
      reminderAfterDueIntervalDays: { type: ["integer", "null"] },
    },
    required: ["name", "email"],
  },
};

function buildSystemPrompt(): string {
  return `You are a client extraction assistant for a B2B invoicing app.
The user spoke (or pasted) details for ONE new client (contact person / company).

You must call create_client exactly once when you have at least name and email, then stop.

Rules:
1. name and email are required; infer a reasonable name only if the user clearly referred to a person or company.
2. email must look valid; if they spelled a domain, normalize to a proper email.
3. phone: only set if the user gave digits; format as international +countrycode number (e.g. +573011234567). If unsure, omit phone (null).
4. address, nit, businessName: set only when stated; otherwise null.
5. reminder fields: set only if the user explicitly asked for reminder intervals in days; otherwise null.
6. If the transcript is thin but mentions a company and contact, still produce one create_client the user can edit later.`;
}

async function executeCreateClient(
  workspaceId: number,
  input: unknown,
): Promise<unknown> {
  const parsed = createClientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.format(),
      ok: false,
      validationErrors: parsed.error.flatten(),
    };
  }

  try {
    const client = await clientsService.createClient(
      workspaceId,
      parsed.data,
    );
    return {
      name: client.name,
      ok: true,
      sequence: client.sequence,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err), ok: false };
  }
}

function extractClientSuccess(
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
    const cast = result as { name: string; sequence: number };
    return { name: cast.name, sequence: cast.sequence };
  }
  return null;
}

export type VoiceClientResult =
  | { error: "anthropic_unconfigured" }
  | { error: "creation_failed"; message: string }
  | { name: string; sequence: number };

/**
 * Parse a transcript with Claude (tool use) and create one client.
 */
export async function createClientFromVoiceTranscript(
  workspaceId: number,
  transcript: string,
): Promise<VoiceClientResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { error: "anthropic_unconfigured" };
  }

  const system = buildSystemPrompt();

  const results = await runAgenticToolLoop(
    {
      maxRounds: MAX_TOOL_ROUNDS,
      model: VOICE_EXTRACTION_MODEL,
      system,
      tools: [CREATE_CLIENT_TOOL],
      userMessage: transcript,
    },
    (name, toolInput) => {
      if (name === "create_client") {
        return executeCreateClient(workspaceId, toolInput);
      }
      return Promise.resolve({ error: `Unknown tool: ${name}`, ok: false });
    },
  );

  const success = results
    .filter((r) => r.name === "create_client")
    .map((r) => extractClientSuccess(r.result))
    .find((r) => r !== null);

  if (success) return success;

  return {
    error: "creation_failed",
    message:
      "Could not create a client from the transcript. Try giving name, email, and optional phone or address more clearly.",
  };
}
