import { useEffect, useState } from 'react'

/**
 * Trailing-edge debounce for search inputs.
 *
 * Port of the web's `hooks/useDebouncedValue.ts`; 300ms matches
 * `useDebouncedTableParams`, so mobile and web issue requests at the same
 * cadence against the same endpoint.
 */
export function useDebouncedValue<T>(value: T, delayMs = 300): T {
	const [debounced, setDebounced] = useState(value)

	useEffect(() => {
		const timer = setTimeout(() => setDebounced(value), delayMs)
		return () => clearTimeout(timer)
	}, [value, delayMs])

	return debounced
}
