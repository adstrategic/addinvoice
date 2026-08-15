import { useCallback } from 'react'
import type { FieldValues, UseFormReturn } from 'react-hook-form'

type DirtyMap = Record<string, unknown>

/**
 * Extracts only the modified fields from a React Hook Form, for PATCH requests.
 *
 * Port of the web's `hooks/useDirtyValues.ts`, including its array rule: if any
 * element of an array is dirty the **whole** array is sent, because the backend
 * replaces collections wholesale rather than merging them.
 *
 * This matters beyond payload size. The clients PATCH body is
 * `createClientSchema.partial()`, and the shared `nullableOptional` preprocessor
 * turns `''` into `null` — so re-sending an untouched empty phone as `''` is
 * fine, but re-sending a *populated* field the user never looked at risks
 * clobbering a concurrent edit. Only sending what changed avoids both.
 */
export function useDirtyValues<T extends FieldValues>(form: UseFormReturn<T>) {
	const { dirtyFields, isDirty } = form.formState

	const getDirtyValues = useCallback(
		(allValues: T): Partial<T> => extractDirtyValues(allValues, dirtyFields as DirtyMap) as Partial<T>,
		[dirtyFields],
	)

	return { getDirtyValues, hasDirtyFields: isDirty }
}

function extractDirtyValues(values: unknown, dirtyMap: unknown): unknown {
	if (typeof dirtyMap !== 'object' || dirtyMap === null) return values

	const keys = Object.keys(dirtyMap as DirtyMap)

	// React Hook Form keys dirty array entries by index. Any dirty element means
	// the caller gets the entire array back.
	if (Array.isArray(values)) {
		const hasDirtyElement = keys.some((key) => {
			const flag = (dirtyMap as DirtyMap)[key]
			return flag === true || (typeof flag === 'object' && flag !== null)
		})
		return hasDirtyElement ? values : undefined
	}

	const source = (values ?? {}) as DirtyMap

	return keys.reduce<DirtyMap>((acc, key) => {
		const flag = (dirtyMap as DirtyMap)[key]
		const value = source[key]

		if (flag === true) {
			acc[key] = value
			return acc
		}

		if (typeof flag === 'object' && flag !== null && value !== null) {
			const nested = extractDirtyValues(value, flag)
			const isNonEmpty = Array.isArray(nested)
				? nested.length > 0
				: nested !== undefined && Object.keys(nested as DirtyMap).length > 0

			if (isNonEmpty) acc[key] = nested
		}

		return acc
	}, {})
}
