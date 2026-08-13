import axios, { type AxiosInstance } from 'axios'

/**
 * Unauthenticated client for public endpoints. No token interceptor and no
 * redirect interceptor — a 401 here is a real error, not a session problem.
 */
const createPublicApiClient = (): AxiosInstance => {
	const baseURL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:4000'

	return axios.create({
		baseURL: `${baseURL}/api/v1`,
		headers: { 'Content-Type': 'application/json' },
	})
}

export const publicApiClient = createPublicApiClient()
