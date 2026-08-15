import {
	clientResponseSchema,
	type ClientResponse,
	type CreateClientDTO,
	type UpdateClientDTO,
} from '@addinvoice/schemas'

import {
	clientResponseListSchema,
	type ClientResponseList,
	type ListClientsParams,
} from '@/features/clients/schema/clients.schema'
import { apiClient } from '@/lib/api/client'
import type { ApiSuccessResponse, LogoUpload } from '@/lib/api/types'
import { handleApiError } from '@/lib/errors/handler'

const BASE_URL = '/clients'

/**
 * Note the asymmetry the backend imposes: reads are keyed by `sequence`
 * (the per-workspace human-facing number) while writes are keyed by `id`.
 * See `apps/backend/src/features/clients/clients.routes.ts`.
 */

async function listClients(params?: ListClientsParams): Promise<ClientResponseList> {
	try {
		// This endpoint returns `{ data, pagination, stats }` at the top level,
		// not under `data.data`.
		const { data } = await apiClient.get<ClientResponseList>(BASE_URL, {
			params: {
				page: params?.page ?? 1,
				limit: params?.limit ?? 20,
				search: params?.search,
			},
		})

		return clientResponseListSchema.parse(data)
	} catch (error) {
		handleApiError(error)
	}
}

async function getClientBySequence(sequence: number): Promise<ClientResponse> {
	try {
		const { data } = await apiClient.get<ApiSuccessResponse<ClientResponse>>(
			`${BASE_URL}/${sequence}`,
		)

		return clientResponseSchema.parse(data.data)
	} catch (error) {
		handleApiError(error)
	}
}

async function createClient(dto: CreateClientDTO): Promise<ClientResponse> {
	try {
		const { data } = await apiClient.post<ApiSuccessResponse<ClientResponse>>(BASE_URL, dto)

		return clientResponseSchema.parse(data.data)
	} catch (error) {
		handleApiError(error)
	}
}

async function updateClient(id: number, dto: UpdateClientDTO): Promise<ClientResponse> {
	try {
		const { data } = await apiClient.patch<ApiSuccessResponse<ClientResponse>>(
			`${BASE_URL}/${id}`,
			dto,
		)

		return clientResponseSchema.parse(data.data)
	} catch (error) {
		handleApiError(error)
	}
}

async function deleteClient(id: number): Promise<void> {
	try {
		// Documented as a soft delete on the backend, but `clients.service.ts`
		// calls `tx.client.delete` — it is a hard delete with no restore path.
		await apiClient.delete(`${BASE_URL}/${id}`)
	} catch (error) {
		handleApiError(error)
	}
}

async function uploadLogo(id: number, file: LogoUpload): Promise<ClientResponse> {
	try {
		const formData = new FormData()
		// RN's FormData takes a {uri,name,type} descriptor rather than a File.
		formData.append('logo', file as unknown as Blob)

		const { data } = await apiClient.post<ApiSuccessResponse<ClientResponse>>(
			`${BASE_URL}/${id}/logo`,
			formData,
			// Must be set explicitly. `undefined` does NOT clear the client's
			// 'application/json' default — axios substitutes
			// 'application/x-www-form-urlencoded', and RN hands that to OkHttp's
			// MultipartBody.Builder, which rejects any non-multipart type. The send
			// then throws before a socket opens and surfaces as "Network Error" with
			// no response. RN appends the boundary to this value itself.
			{ headers: { 'Content-Type': 'multipart/form-data' } },
		)

		return clientResponseSchema.parse(data.data)
	} catch (error) {
		handleApiError(error)
	}
}

export const clientsService = {
	list: listClients,
	getBySequence: getClientBySequence,
	create: createClient,
	update: updateClient,
	delete: deleteClient,
	uploadLogo,
}
