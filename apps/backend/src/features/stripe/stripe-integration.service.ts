import Stripe from 'stripe'
import { decrypt } from '../../core/encryption.js'
import type { InvoiceEntityWithRelations } from '../invoices/invoices.schemas.js'

const STRIPE_API_VERSION = '2025-02-24.acacia' as const

/**
 * Creates a per-workspace Stripe client by decrypting the stored encrypted key.
 */
export function createPerWorkspaceStripeClient(encryptedKey: string): Stripe {
	const secretKey = decrypt(encryptedKey)
	return new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION, typescript: true })
}

/**
 * Validates a Stripe secret key and auto-registers a webhook endpoint on the
 * user's Stripe account pointing to our per-workspace webhook URL.
 *
 * Returns { webhookId, webhookSecret } on success.
 * Returns { webhookId: null, webhookSecret: null } if webhook registration fails
 * due to insufficient key permissions — caller should surface manual setup instructions.
 */
export async function validateAndRegisterWebhook(
	secretKey: string,
	workspaceId: number,
	appBaseUrl: string,
): Promise<{ webhookId: string | null; webhookSecret: string | null }> {
	const stripeClient = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION, typescript: true })

	// Validates the key — throws Stripe.errors.StripeAuthenticationError if invalid
	await stripeClient.accounts.retrieve()

	const webhookUrl = `${appBaseUrl.replace(/\/$/, '')}/api/v1/stripe/webhook/${workspaceId}`

	try {
		const endpoint = await stripeClient.webhookEndpoints.create({
			enabled_events: ['checkout.session.completed'],
			url: webhookUrl,
		})
		return { webhookId: endpoint.id, webhookSecret: endpoint.secret ?? null }
	} catch (err) {
		// Key is valid but lacks webhook:write permissions — degrade gracefully
		console.warn(
			`[stripe] Could not auto-register webhook for workspace ${workspaceId}:`,
			err instanceof Error ? err.message : err,
		)
		return { webhookId: null, webhookSecret: null }
	}
}

/**
 * Creates a Stripe Checkout Session for an invoice.
 * Line items are built from invoice.items. Invoice-level tax (BY_TOTAL) and
 * invoice-level discounts are handled as separate line items / Stripe Coupons.
 *
 * Returns the hosted checkout URL.
 */
export async function createCheckoutSession(
	stripeClient: Stripe,
	invoice: InvoiceEntityWithRelations,
	successUrl: string,
	cancelUrl: string,
): Promise<string> {
	const currency = invoice.currency.toLowerCase()
	const items = invoice.items ?? []

	if (items.length === 0) {
		throw new Error('Cannot create a Stripe Checkout Session for an invoice with no items')
	}

	// Build line items — use the pre-calculated item.total to avoid re-implementing
	// discount and tax logic. Each line item shows the post-discount (item-level) amount.
	const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = items.map((item) => {
		const itemTotal = Number(item.total)
		const quantity = Number(item.quantity)
		// unit_amount must be a non-negative integer in the smallest currency unit (cents)
		const unitAmount = Math.round((itemTotal / quantity) * 100)
		return {
			price_data: {
				currency,
				product_data: {
					description: item.description || undefined,
					name: item.name,
				},
				unit_amount: Math.max(0, unitAmount),
			},
			quantity,
		}
	})

	// For BY_TOTAL tax mode, add a dedicated tax line item
	if (invoice.taxMode === 'BY_TOTAL' && Number(invoice.totalTax) > 0) {
		lineItems.push({
			price_data: {
				currency,
				product_data: {
					name: invoice.taxName ?? 'Tax',
				},
				unit_amount: Math.round(Number(invoice.totalTax) * 100),
			},
			quantity: 1,
		})
	}

	// For invoice-level discounts, create a Stripe Coupon and attach it to the session
	let discounts: Stripe.Checkout.SessionCreateParams['discounts'] = undefined
	if (invoice.discountType !== 'NONE' && Number(invoice.discount) > 0) {
		const couponParams: Stripe.CouponCreateParams =
			invoice.discountType === 'PERCENTAGE'
				? { duration: 'once', percent_off: Number(invoice.discount) }
				: {
						amount_off: Math.round(Number(invoice.discount) * 100),
						currency,
						duration: 'once',
					}
		const coupon = await stripeClient.coupons.create(couponParams)
		discounts = [{ coupon: coupon.id }]
	}

	const session = await stripeClient.checkout.sessions.create({
		cancel_url: cancelUrl,
		discounts,
		line_items: lineItems,
		metadata: {
			invoiceId: String(invoice.id),
			workspaceId: String(invoice.workspaceId),
		},
		mode: 'payment',
		success_url: successUrl,
	})

	if (!session.url) {
		throw new Error('Stripe did not return a checkout URL')
	}

	return session.url
}

/**
 * Deletes a webhook endpoint from the user's Stripe account.
 * Silently ignores 404 (already deleted or never existed).
 */
export async function deregisterWebhook(
	stripeClient: Stripe,
	webhookId: string,
): Promise<void> {
	try {
		await stripeClient.webhookEndpoints.del(webhookId)
	} catch (err) {
		if (err instanceof Stripe.errors.StripeError && err.statusCode === 404) return
		throw err
	}
}
