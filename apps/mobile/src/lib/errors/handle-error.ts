import type { FieldValues, Path, UseFormSetError } from 'react-hook-form'
import { toast } from 'sonner-native'

import type { ApiErrorCode } from '@/lib/api/types'
import { useUpgradeStore } from '@/lib/upgrade/store'

import { ApiError } from './handler'

function normalizeToApiError(err: unknown): ApiError {
	if (err instanceof ApiError) return err
	const message = err instanceof Error ? err.message : 'An unexpected error occurred'
	return new ApiError(500, 'INTERNAL_ERROR', message, err)
}

/**
 * Central dispatcher for mutation errors.
 * Toast + setError only; redirects live in the apiClient response interceptor.
 */
export function handleMutationError<T extends FieldValues>(
	err: unknown,
	setError?: UseFormSetError<T>,
): void {
	const apiError = normalizeToApiError(err)
	const code = apiError.code as ApiErrorCode

	switch (code) {
		case 'ERR_VALID':
		case 'CONFLICT': {
			if (setError && apiError.fields && Object.keys(apiError.fields).length > 0) {
				for (const [fieldPath, messages] of Object.entries(apiError.fields)) {
					setError(fieldPath as Path<T>, {
						type: 'server',
						message: messages[0] ?? apiError.message,
					})
				}
				toast.error('Please fix the errors below', { description: apiError.message })
			} else {
				toast.error(apiError.message)
			}
			break
		}

		case 'ERR_NF':
			toast.error(apiError.message)
			break

		case 'UNAUTHORIZED':
			toast.error('Your session expired. Please sign in again.')
			break

		case 'BUSINESS_REQUIRED':
			toast.error(apiError.message ?? 'You need to create a business first.')
			break

		case 'SUBSCRIPTION_REQUIRED':
			toast.error(apiError.message ?? 'Active subscription required.')
			break

		case 'TRIAL_MODULE_LIMIT':
		case 'TRIAL_EMAIL_LIMIT':
		case 'VOICE_MONTHLY_LIMIT':
		case 'ADVANCES_PLAN_REQUIRED':
			useUpgradeStore.getState().show({ code, message: apiError.message })
			break

		case 'TRIAL_NOT_AVAILABLE':
			toast.error(apiError.message)
			break

		case 'NETWORK_ERROR':
			toast.error(apiError.message)
			break

		case 'INTERNAL_ERROR':
		default:
			toast.error('Something went wrong. Please try again.')
			break
	}
}
