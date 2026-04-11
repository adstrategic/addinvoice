import type { ReceiptScanResult } from "@addinvoice/schemas";

import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";

const RECEIPT_EXTRACTION_PROMPT = `You are analyzing an image of a receipt. Extract the following fields if they are clearly visible. Use null for any field that is not found, unclear, or ambiguous.
Respond ONLY with a valid JSON object, no markdown, no explanation:
{
  "description": "short merchant/purchase description",
    "subtotal": 0.00,
    "tax": 0.00,
    "total": 0.00,
    "expenseDate": "YYYY-MM-DD",
  }
If a value cannot be found, use null.`;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const receiptSchema = z.object({
  description: z.string().nullable(),
  expenseDate: z.string().nullable(),
  tax: z.number().nullable(),
  total: z.number().nullable(),
});

const receiptJsonSchema = {
  type: "object",
  properties: {
    description: {
      type: "string",
      description: "Merchant name or purchase description",
    },
    expenseDate: {
      type: "string",
      description: "Date of the purchase, or null if not found",
    },
    tax: { type: "number", description: "Tax amount, or null if not found" },
    total: { type: "number", description: "Final total amount" },
  },
  required: ["description", "total"],
  additionalProperties: false,
};

type ReceiptData = z.infer<typeof receiptSchema>;

/**
 * Scan a receipt image with Claude Vision and return structured fields.
 * Requires ANTHROPIC_API_KEY. Returns null if the key is not set (caller should respond with 503).
 */
export async function scanReceiptImage(
  file: Express.Multer.File,
): Promise<null | ReceiptScanResult> {
  const client = new Anthropic();

  const imageBuffer = file.buffer;
  const base64Image = imageBuffer.toString("base64");
  const mimeType = file.mimetype as "image/jpeg" | "image/png" | "image/webp";

  const response = await client.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 1024,
    output_config: {
      // format: zodOutputFormat(receiptSchema),
      format: {
        type: "json_schema",
        schema: receiptJsonSchema,
      },
    },
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mimeType,
              data: base64Image,
            },
          },
          {
            type: "text",
            text: RECEIPT_EXTRACTION_PROMPT,
          },
        ],
      },
    ],
  });

  const block = response.content[0];
  if (!block || !("text" in block)) return null;

  const data = JSON.parse(block.text) as ReceiptData;

  return {
    total: data.total,
    tax: data.tax,
    expenseDate: data.expenseDate,
    description: data.description,
  };
}
