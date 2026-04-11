import type {
  MessageParam,
  Tool,
  ToolResultBlockParam,
} from "@anthropic-ai/sdk/resources/messages/messages";

import { prisma } from "@addinvoice/db";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI, { toFile } from "openai";

import { createInvoiceSchema } from "./invoices.schemas.js";
import * as invoicesService from "./invoices.service.js";

const VOICE_INVOICE_MODEL = "claude-haiku-4-5";
const MAX_TOOL_ROUNDS = 12;

/** Single tool: line items and totals from transcript; client is fixed by the app. */
const CREATE_INVOICE_TOOL: Tool = {
  name: "create_invoice",
  description:
    "Create a DRAFT invoice for the customer already chosen in the app. businessId and customer (clientId, clientEmail, createClient) are set by the server — do not invent a different customer. Use suggestedNextInvoiceNumber for invoiceNumber unless the user gave a different explicit number. Prefer taxMode NONE unless the user clearly asked for tax. Dates as YYYY-MM-DD. Each line item needs name, description, quantity, and unitPrice (positive).",
  input_schema: {
    type: "object",
    properties: {
      createClient: { type: "boolean" },
      clientId: { type: "number" },
      clientEmail: { type: "string" },
      clientData: {
        type: ["object", "null"],
        properties: {
          name: { type: "string" },
          email: { type: "string" },
          phone: { type: ["string", "null"] },
          address: { type: ["string", "null"] },
          nit: { type: ["string", "null"] },
          businessName: { type: ["string", "null"] },
        },
        required: ["name", "email"],
      },
      invoiceNumber: { type: "string" },
      issueDate: { type: "string", description: "YYYY-MM-DD" },
      dueDate: { type: "string", description: "YYYY-MM-DD" },
      currency: { type: "string" },
      taxMode: {
        type: "string",
        enum: ["NONE", "BY_PRODUCT", "BY_TOTAL"],
      },
      taxName: { type: ["string", "null"] },
      taxPercentage: { type: ["number", "null"] },
      notes: { type: ["string", "null"] },
      terms: { type: ["string", "null"] },
      discount: { type: "number" },
      discountType: {
        type: "string",
        enum: ["NONE", "PERCENTAGE", "FIXED"],
      },
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
            quantityUnit: {
              type: "string",
              enum: ["DAYS", "HOURS", "UNITS"],
            },
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
      "invoiceNumber",
      "issueDate",
      "dueDate",
      "currency",
      "taxMode",
      "discount",
      "discountType",
      "items",
    ],
  },
};

const VOICE_INVOICE_TOOLS: Tool[] = [CREATE_INVOICE_TOOL];

function buildSystemPrompt(params: {
  businessId: number;
  businessName: string;
  lockedClient: { email: string; id: number; name: string };
  suggestedNextInvoiceNumber: string;
  todayIso: string;
}): string {
  return `You are an invoice extraction assistant for a B2B invoicing app. The user spoke (or pasted) a description of line items, quantities, prices, and optional dates or notes for ONE invoice. The customer is already selected in the UI — you must not change or guess the customer.

You must call create_invoice exactly once when you have enough detail, then stop.

Fixed customer (the server enforces these on save — still set createClient false, clientId, and clientEmail in your tool call to match):
- clientId: ${String(params.lockedClient.id)}
- clientEmail: ${params.lockedClient.email}
- customer display name (context only): ${params.lockedClient.name}

Business context:
- businessId: ${String(params.businessId)} (server injects into create_invoice)
- businessName: ${params.businessName}
- suggestedNextInvoiceNumber: ${params.suggestedNextInvoiceNumber} — use as invoiceNumber unless the user explicitly said a different number
- today (default issue date): ${params.todayIso}

Rules:
1. create_invoice: set createClient to false, clientId to ${String(params.lockedClient.id)}, clientEmail to exactly "${params.lockedClient.email}".
2. Use taxMode NONE and discountType NONE unless the user clearly specified otherwise. For BY_TOTAL tax, set taxName and taxPercentage.
3. issueDate defaults to ${params.todayIso} if not stated. dueDate defaults to 30 days after issue date if not stated.
4. Every line item: name, description, quantity > 0, unitPrice > 0; quantityUnit defaults to UNITS.
5. If the transcript is vague, infer one reasonable line item from what they said (user can edit the draft later).

Extract line items and amounts from the transcript only — ignore any other customer names they mention; the customer is fixed above.`;
}

export type VoiceInvoiceResult =
  | { error: "anthropic_unconfigured" }
  | { error: "creation_failed"; message: string }
  | {
      invoiceNumber: string;
      sequence: number;
    };

interface LockedClient {
  email: string;
  id: number;
  name: string;
}

async function executeCreateInvoiceTool(
  workspaceId: number,
  businessId: number,
  input: unknown,
  lockedClient: LockedClient,
): Promise<unknown> {
  const body: Record<string, unknown> = {
    ...(input as Record<string, unknown>),
    businessId,
    clientEmail: lockedClient.email,
    clientId: lockedClient.id,
    createClient: false,
  };

  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return {
      fieldErrors: parsed.error.format(),
      ok: false,
      validationErrors: parsed.error.flatten(),
    };
  }
  try {
    const invoice = await invoicesService.createInvoice(
      workspaceId,
      parsed.data,
    );
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      ok: true,
      sequence: invoice.sequence,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return { error: message, ok: false };
  }
}

/**
 * Transcribe audio buffer via OpenAI Whisper (auto-detects language).
 * Accepts audio/webm or audio/mp4 — both produced natively by MediaRecorder.
 */
export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const file = await toFile(buffer, `recording.${ext}`, { type: mimeType });
  const response = await openai.audio.transcriptions.create({
    model: "whisper-1",
    file,
  });
  return response.text;
}

/**
 * Parse transcript with Claude (tool use) and create one draft invoice for a fixed client.
 */
export async function createInvoiceFromVoiceTranscript(
  workspaceId: number,
  businessId: number,
  clientId: number,
  transcript: string,
): Promise<VoiceInvoiceResult> {
  if (!process.env.ANTHROPIC_API_KEY?.trim()) {
    return { error: "anthropic_unconfigured" };
  }

  const business = await prisma.business.findFirst({
    select: {
      id: true,
      name: true,
    },
    where: {
      id: businessId,
      workspaceId,
    },
  });

  if (!business) {
    return {
      error: "creation_failed",
      message: "Business not found or does not belong to your workspace",
    };
  }

  const clientRow = await prisma.client.findFirst({
    select: {
      email: true,
      id: true,
      name: true,
    },
    where: {
      id: clientId,
      workspaceId,
    },
  });

  if (!clientRow) {
    return {
      error: "creation_failed",
      message: "Client not found or does not belong to your workspace",
    };
  }

  const lockedClient: LockedClient = {
    email: clientRow.email,
    id: clientRow.id,
    name: clientRow.name,
  };

  const suggestedNextInvoiceNumber =
    await invoicesService.getNextInvoiceNumberForWorkspace(
      workspaceId,
      businessId,
    );

  const todayIso = new Date().toISOString().slice(0, 10);
  const system = buildSystemPrompt({
    businessId,
    businessName: business.name,
    lockedClient,
    suggestedNextInvoiceNumber,
    todayIso,
  });

  console.info("[voice-invoice] transcript length", transcript.length);

  const anthropic = new Anthropic();
  const messages: MessageParam[] = [
    {
      role: "user",
      content: transcript,
    },
  ];

  let lastInvoiceSuccess: null | { invoiceNumber: string; sequence: number } =
    null;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      max_tokens: 8192,
      messages,
      model: VOICE_INVOICE_MODEL,
      system,
      tools: VOICE_INVOICE_TOOLS,
    });

    if (response.stop_reason === "end_turn") {
      break;
    }

    if (response.stop_reason !== "tool_use") {
      break;
    }

    messages.push({
      role: "assistant",
      content: response.content as MessageParam["content"],
    });

    const toolResults: ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") {
        continue;
      }
      const result =
        block.name === "create_invoice"
          ? await executeCreateInvoiceTool(
              workspaceId,
              businessId,
              block.input,
              lockedClient,
            )
          : { error: `Unknown tool: ${block.name}`, ok: false };

      if (
        block.name === "create_invoice" &&
        result &&
        typeof result === "object" &&
        "ok" in result &&
        (result as { ok: boolean }).ok &&
        "sequence" in result &&
        "invoiceNumber" in result
      ) {
        const r = result as unknown as {
          invoiceNumber: string;
          sequence: number;
        };
        lastInvoiceSuccess = {
          invoiceNumber: r.invoiceNumber,
          sequence: r.sequence,
        };
      }
      toolResults.push({
        content: JSON.stringify(result),
        tool_use_id: block.id,
        type: "tool_result",
      });
    }

    if (toolResults.length === 0) {
      break;
    }

    messages.push({
      role: "user",
      content: toolResults,
    });
  }

  if (lastInvoiceSuccess) {
    return lastInvoiceSuccess;
  }

  return {
    error: "creation_failed",
    message:
      "Could not create an invoice from the transcript. Try describing line items, quantities, and amounts more clearly.",
  };
}
