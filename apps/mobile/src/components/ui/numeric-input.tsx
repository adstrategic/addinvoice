import { forwardRef, useEffect, useState } from 'react'
import type { TextInput } from 'react-native'

import { Input, type InputProps } from './input'

export type NumericInputProps = Omit<
	InputProps,
	'value' | 'defaultValue' | 'onChangeText' | 'keyboardType'
> & {
	value: number | null | undefined
	onChangeValue: (value: number | null) => void
	/** Permit a decimal separator. Integers only when false. */
	decimal?: boolean
	/** Permit a leading minus sign. Off by default — most fields here are amounts. */
	allowNegative?: boolean
}

/**
 * Strips anything that cannot appear in a number, and normalises the decimal
 * separator.
 *
 * Both `,` and `.` are accepted: Android's `decimal-pad` shows whichever
 * separator the device locale uses, so a user on a comma locale physically
 * cannot type a dot.
 */
function sanitize(raw: string, decimal: boolean, allowNegative: boolean): string {
	const withDot = raw.replace(/,/g, '.')
	const isNegative = allowNegative && withDot.trimStart().startsWith('-')
	let digits = withDot.replace(/[^0-9.]/g, '')

	if (!decimal) {
		digits = digits.replace(/\./g, '')
	} else {
		// Keep only the first separator, so "1.2.3" cannot be typed.
		const first = digits.indexOf('.')
		if (first !== -1) {
			digits = digits.slice(0, first + 1) + digits.slice(first + 1).replace(/\./g, '')
		}
	}

	return isNegative ? `-${digits}` : digits
}

/**
 * `''`, `'.'` and `'-'` are legitimate half-typed states rather than numbers,
 * so they resolve to null instead of NaN.
 */
function parse(text: string): number | null {
	if (text === '' || text === '.' || text === '-' || text === '-.') return null
	const parsed = Number(text)
	return Number.isFinite(parsed) ? parsed : null
}

function format(value: number | null | undefined): string {
	return value == null ? '' : String(value)
}

/**
 * Numeric text field backed by a string.
 *
 * Holding the raw text locally is what makes a decimal typeable at all. Driving
 * the input straight from the numeric form value round-trips every keystroke
 * through `Number()`, which breaks in two visible ways: `Number(',')` is `NaN`
 * and renders as the literal text "NaN", and `Number('19.')` is `19`, so the
 * separator is deleted the instant it is typed and the user can never reach the
 * decimal part.
 *
 * The form only ever receives a finite number or null — never NaN.
 */
export const NumericInput = forwardRef<TextInput, NumericInputProps>(function NumericInput(
	{ value, onChangeValue, decimal = true, allowNegative = false, ...props },
	ref,
) {
	const [text, setText] = useState(() => format(value))

	// Re-sync when the value changes from outside — a form reset, or setValue()
	// from another field. Comparing the *parsed* text rather than the string is
	// what keeps a half-typed "19." from being rewritten to "19" mid-edit, since
	// both parse to the same number. Converges after one extra pass, because
	// parse(format(n)) === n.
	useEffect(() => {
		if (parse(text) !== (value ?? null)) {
			setText(format(value))
		}
	}, [value, text])

	function handleChangeText(raw: string) {
		const next = sanitize(raw, decimal, allowNegative)
		setText(next)
		onChangeValue(parse(next))
	}

	return (
		<Input
			ref={ref}
			value={text}
			onChangeText={handleChangeText}
			keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
			{...props}
		/>
	)
})
