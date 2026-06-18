/**
 * TipTap/ProseMirror helpers for the agent.
 *
 * The agent collects rich-text fields (descriptions, notes, terms, summary) as
 * plain strings, but the database stores them as TipTap document JSON. The PDF
 * service later runs `generateHTML(value, [StarterKit])`, which requires a valid
 * `{ type: "doc", content: [...] }` document — a plain string throws
 * `Unknown node type: undefined`. Normalize before persisting.
 */

import type { Prisma } from '@addinvoice/db';

function isValidTipTapDoc(value: unknown): boolean {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    (value as Record<string, unknown>).type === 'doc' &&
    Array.isArray((value as Record<string, unknown>).content)
  );
}

/** Wrap plain text in the simplest valid TipTap doc; pass through valid docs. */
export function normalizeTipTapField(value: unknown): Prisma.InputJsonValue {
  if (isValidTipTapDoc(value)) return value as Prisma.InputJsonValue;
  if (typeof value === 'string' && value.trim().length > 0) {
    return {
      type: 'doc',
      content: [{ type: 'paragraph', content: [{ type: 'text', text: value.trim() }] }],
    };
  }
  return { type: 'doc', content: [{ type: 'paragraph' }] }; // empty-but-valid
}

/** For nullable fields: preserve null, otherwise normalize. */
export function normalizeTipTapFieldNullable(value: unknown): Prisma.InputJsonValue | null {
  return value == null ? null : normalizeTipTapField(value);
}
