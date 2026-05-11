function isValidTipTapDoc(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).type === "doc" &&
    Array.isArray((value as Record<string, unknown>).content)
  );
}

export function normalizeTipTapField(
  value: unknown,
): Record<string, unknown> {
  if (isValidTipTapDoc(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim().length > 0) {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: value.trim() }],
        },
      ],
    };
  }

  return { type: "doc", content: [{ type: "paragraph" }] };
}

export const TIPTAP_DOC_JSON_SCHEMA_NULLABLE = {
  type: ["object", "null"],
  description:
    "A TipTap/ProseMirror document object, or null if the user did not provide content for this field. When provided, must have type='doc' and a content array of block nodes. See system prompt for format details.",
  properties: {
    type: { type: "string" },
    content: { type: "array" },
  },
} as const;

export const TIPTAP_DOC_JSON_SCHEMA_REQUIRED = {
  type: "object",
  description:
    "A TipTap/ProseMirror document object. Must have type='doc' and a content array of block nodes. See system prompt for format details.",
  properties: {
    type: { type: "string" },
    content: { type: "array" },
  },
  required: ["type", "content"],
} as const;

export const TIPTAP_SYSTEM_PROMPT_INSTRUCTIONS = `Rich text fields in your output must be TipTap/ProseMirror JSON objects, never plain strings. The LLM will receive JSON tool schemas with type='object' and a content array; you must generate the correct structure.

TipTap/ProseMirror Document Structure:
- Root: { type: "doc", content: [array of block nodes] }
- Supported block nodes:
  - paragraph: { type: "paragraph", content: [array of inline nodes] }
  - heading: { type: "heading", attrs: { level: 2 or 3 }, content: [array of inline nodes] }
  - bulletList: { type: "bulletList", content: [listItem nodes] }
  - orderedList: { type: "orderedList", content: [listItem nodes] }
  - listItem: { type: "listItem", content: [paragraph nodes] }
- Supported inline nodes:
  - text: { type: "text", text: "string content", marks?: [] }
  - text with bold: { type: "text", text: "...", marks: [{ type: "bold" }] }
  - text with italic: { type: "text", text: "...", marks: [{ type: "italic" }] }
  - text with bold AND italic: { type: "text", text: "...", marks: [{ type: "bold" }, { type: "italic" }] }

When to Use Rich Text Formatting:
- Default to plain paragraphs for most content (most voice transcripts do not warrant complex formatting).
- Use bulletList/orderedList ONLY when the user explicitly listed items (e.g., "include these three things...").
- Use heading (level 2 or 3) ONLY when the user described distinct labeled sections (e.g., "add a payment terms section").
- Use bold ONLY when the user verbally emphasized a word or phrase (e.g., "make sure it says URGENT").
- Use italic ONLY when the user verbally emphasized a word or phrase (same context as bold).

Examples:

1. Simple description (most common — single paragraph with no formatting):
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Painting services for interior walls, includes prep work and cleanup." }
      ]
    }
  ]
}

2. Two-paragraph notes:
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "First paragraph of notes." }
      ]
    },
    {
      "type": "paragraph",
      "content": [
        { "type": "text", "text": "Second paragraph of notes." }
      ]
    }
  ]
}

3. Bullet-list terms (only if user explicitly listed items):
{
  "type": "doc",
  "content": [
    {
      "type": "bulletList",
      "content": [
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "text": "First item" }
              ]
            }
          ]
        },
        {
          "type": "listItem",
          "content": [
            {
              "type": "paragraph",
              "content": [
                { "type": "text", "text": "Second item" }
              ]
            }
          ]
        }
      ]
    }
  ]
}

Null Instruction:
For optional rich text fields that the user did not mention or provide content for, output null (not an empty doc).`;
