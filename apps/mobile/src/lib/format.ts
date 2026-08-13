/**
 * js-hoist-intl: Intl objects parse locale data and build lookup tables, so they
 * are cached at module scope and never constructed inside render.
 */
const currencyFormatters = new Map<string, Intl.NumberFormat>()

export function formatCurrency(amount: number, currency = 'USD', locale = 'en-US'): string {
	const key = `${locale}:${currency}`
	let formatter = currencyFormatters.get(key)
	if (!formatter) {
		formatter = new Intl.NumberFormat(locale, { style: 'currency', currency })
		currencyFormatters.set(key, formatter)
	}
	return formatter.format(amount)
}

const dateFormatter = new Intl.DateTimeFormat('en-US', {
	year: 'numeric',
	month: 'short',
	day: 'numeric',
})

export function formatDate(date: Date): string {
	return dateFormatter.format(date)
}
