/**
 * TipTap ProseMirror JSON defaults for the first business, copied verbatim from
 * apps/frontend/app/setup/page.tsx.
 *
 * These are plain constants, not editor output — the setup screen needs no
 * rich-text editor to send them. Only nodes vanilla StarterKit can render appear
 * here, because apps/pdf-service throws on unknown node types.
 */
export const SETUP_DEFAULT_NOTES: Record<string, unknown> = {
	type: 'doc',
	content: [
		{
			type: 'paragraph',
			content: [
				{
					type: 'text',
					text: 'Thank you for your business. Please review all invoice details carefully and contact us with any questions or concerns within 3 business days. We appreciate the opportunity to serve you.',
				},
			],
		},
	],
}

const termsListItem = (text: string) => ({
	type: 'listItem',
	content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
})

export const SETUP_DEFAULT_TERMS: Record<string, unknown> = {
	type: 'doc',
	content: [
		{
			type: 'bulletList',
			content: [
				termsListItem('Payment is due according to the terms listed on this invoice.'),
				termsListItem('Late payments may be subject to additional fees or interest.'),
				termsListItem(
					'All sales/services provided are considered accepted unless reported otherwise within 3 business days.',
				),
				termsListItem(
					'Deposits and completed work are non-refundable unless otherwise agreed in writing.',
				),
				termsListItem('By submitting, the customer agrees to these terms and conditions.'),
			],
		},
	],
}
