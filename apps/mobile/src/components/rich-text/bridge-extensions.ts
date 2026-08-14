import {
	BlockquoteBridge,
	BoldBridge,
	BulletListBridge,
	CodeBridge,
	CoreBridge,
	DropCursorBridge,
	HardBreakBridge,
	HeadingBridge,
	HistoryBridge,
	ItalicBridge,
	LinkBridge,
	ListItemBridge,
	OrderedListBridge,
	PlaceholderBridge,
	StrikeBridge,
	UnderlineBridge,
} from '@10play/tentap-editor'

/**
 * The single source of truth for what the mobile editor may produce.
 *
 * ## Why this list exists
 *
 * `apps/pdf-service` renders stored documents with
 * `generateHTML(doc, [StarterKit])`. TipTap throws `Unknown node type` on any
 * node its extension set does not know, and for invoice sends that happens
 * inside the BullMQ worker (`apps/backend/src/queue/workers.ts`) — i.e. at the
 * exact moment the customer should be receiving the invoice. The REST layer
 * will not catch it either, because the field is validated as
 * `z.record(z.string(), z.unknown())`.
 *
 * `TenTapStartKit` is a superset of what StarterKit can render, so the editor
 * must be narrowed to the intersection. TenTap's default web bundle already
 * filters by whitelist, so no custom Vite build is needed — only fewer
 * extensions, never more.
 *
 * ## How this list was derived
 *
 * Checked against the `@tiptap/starter-kit` version `apps/pdf-service` actually
 * resolves (3.22.5). Its registered extensions are: Document, Paragraph, Text,
 * Bold, Italic, Strike, Code, CodeBlock, Heading, Blockquote, BulletList,
 * OrderedList, ListItem, ListKeymap, HardBreak, HorizontalRule, Dropcursor,
 * Gapcursor, History, **Link** and **Underline**.
 *
 * Link and Underline are therefore safe — plan.md flagged both as unverified,
 * and this resolves that: TipTap folded them into StarterKit in v3.
 *
 * ## Deliberately excluded
 *
 * TaskList, TaskItem, Image, Color and Highlight ship in `TenTapStartKit` but
 * are **not** registered by StarterKit, so each one is a worker crash waiting
 * to happen. Do not add them without adding the matching extension to
 * pdf-service first.
 *
 * If pdf-service ever downgrades or re-configures StarterKit, re-derive this
 * list before trusting it.
 */
export const RICH_TEXT_BRIDGE_EXTENSIONS = [
	CoreBridge,
	HistoryBridge,
	BoldBridge,
	ItalicBridge,
	UnderlineBridge,
	StrikeBridge,
	CodeBridge,
	HeadingBridge,
	BulletListBridge,
	OrderedListBridge,
	ListItemBridge,
	BlockquoteBridge,
	LinkBridge,
	HardBreakBridge,
	PlaceholderBridge,
	DropCursorBridge,
]

/**
 * What `getJSON()` returns for an editor with no text.
 *
 * Nullable rich-text fields must be sent as `null`, never as this document: it
 * is truthy, and the PDF templates gate on truthiness
 * (`apps/pdf-service/src/estimate-html.ts` does `item.description ? … : …`), so
 * an "empty" doc renders a stray empty paragraph on the customer's invoice.
 * The backend's own agent prompt gives the same instruction — "output null (not
 * an empty doc)".
 */
export function isEmptyTipTapDoc(doc: unknown): boolean {
	if (doc == null || typeof doc !== 'object') return true

	const content = (doc as { content?: unknown }).content
	if (!Array.isArray(content) || content.length === 0) return true

	return content.every((node) => {
		if (node == null || typeof node !== 'object') return true
		const { type, content: inner } = node as { type?: unknown; content?: unknown }
		if (type !== 'paragraph') return false
		return !Array.isArray(inner) || inner.length === 0
	})
}
