import axios, { type AxiosError, type AxiosInstance } from 'axios'
import { router } from 'expo-router'

import { useUpgradeStore } from '@/lib/upgrade/store'
import type { ApiErrorCode } from '@/lib/api/types'

// Set by ClerkTokenProvider once Clerk is loaded. Keeping it at module scope is
// what lets plain service functions stay React-free.
let getTokenFn: (() => Promise<string | null>) | null = null

export function setClerkTokenGetter(fn: () => Promise<string | null>) {
	getTokenFn = fn
}

/**
 * The web redirects with `window.location.href`, which unmounts everything and
 * makes repeat redirects harmless. `router.replace` does not, so a screen that
 * fires several failing requests would queue several navigations. This collapses
 * them into one.
 */
let isRedirecting = false

function redirectOnce(path: Parameters<typeof router.replace>[0]) {
	if (isRedirecting) return
	isRedirecting = true
	router.replace(path)
	setTimeout(() => {
		isRedirecting = false
	}, 1000)
}

const LIMIT_CODES: ApiErrorCode[] = [
	'TRIAL_MODULE_LIMIT',
	'TRIAL_EMAIL_LIMIT',
	'VOICE_MONTHLY_LIMIT',
	'ADVANCES_PLAN_REQUIRED',
	'TRIAL_NOT_AVAILABLE',
]

/**
 * Base API client.
 *
 * Token refresh: Clerk refreshes tokens automatically, so getToken() is called
 * on every request and always returns a fresh token — no manual refresh logic.
 *
 * Note: no `withCredentials` — native auth is Bearer-only.
 */
const createApiClient = (): AxiosInstance => {
	const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000'

	const client = axios.create({
		baseURL: `${baseURL}/api/v1`,
		headers: { 'Content-Type': 'application/json' },
	})

	client.interceptors.request.use(
		async (config) => {
			const token = await getClerkToken()
			if (token) {
				config.headers.Authorization = `Bearer ${token}`
			}
			return config
		},
		(error) => Promise.reject(error),
	)

	// Single place for redirects on auth/subscription errors.
	// handleMutationError only shows toasts.
	client.interceptors.response.use(
		(response) => response,
		(error: AxiosError) => {
			const status = error.response?.status
			const data = error.response?.data as
				| { code?: string; error?: string; message?: string; readOnly?: boolean }
				| undefined
			const code = data?.code ?? data?.error

			if (status === 401) {
				redirectOnce('/(auth)/sign-in')
			} else if (status === 403 && code === 'BUSINESS_REQUIRED') {
				// redirectTo from the backend is a web path; mobile owns its own routes.
				redirectOnce('/(funnel)/setup')
			} else if (status === 402 && code === 'SUBSCRIPTION_REQUIRED' && !data?.readOnly) {
				// Never routes to a purchase flow (App Store 3.1.1) — terminal status screen.
				redirectOnce('/(funnel)/subscription-required')
			} else if (code && LIMIT_CODES.includes(code as ApiErrorCode)) {
				useUpgradeStore.getState().show({
					code: code as ApiErrorCode,
					message: data?.message ?? 'You have reached a limit on your current plan.',
				})
			}

			return Promise.reject(error)
		},
	)

	return client
}

async function getClerkToken(): Promise<string | null> {
	if (!getTokenFn) return null

	try {
		return await getTokenFn()
	} catch (error) {
		console.error('Error getting Clerk token:', error)
		return null
	}
}

export const apiClient = createApiClient()
