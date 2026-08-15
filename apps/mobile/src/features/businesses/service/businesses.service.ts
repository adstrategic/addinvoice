import {
	businessResponseSchema,
	type BusinessResponse,
	type CreateBusinessDTO,
	type UpdateBusinessDTO,
} from '@addinvoice/schemas'

import {
	businessResponseListSchema,
	type BusinessResponseList,
	type ListBusinessesParams,
} from '@/features/businesses/schema/businesses.schema'
import { apiClient } from '@/lib/api/client'
import type { ApiSuccessResponse, LogoUpload } from '@/lib/api/types'
import { handleApiError } from '@/lib/errors/handler'

const BASE_URL = '/businesses'

/** Re-exported for existing importers; the type itself now lives in lib/api/types. */
export type { LogoUpload }

async function listBusinesses(params?: ListBusinessesParams): Promise<BusinessResponseList> {
	try {
		// This endpoint returns the list envelope at the top level, not under `data.data`.
		const { data } = await apiClient.get<BusinessResponseList>(BASE_URL, {
			params: {
				page: params?.page ?? 1,
				limit: params?.limit ?? 10,
				search: params?.search,
			},
		})

		return businessResponseListSchema.parse(data)
	} catch (error) {
		handleApiError(error)
	}
}

async function getBusinessById(id: number): Promise<BusinessResponse> {
	try {
		const { data } = await apiClient.get<ApiSuccessResponse<BusinessResponse>>(
			`${BASE_URL}/${id}`,
		)
		return businessResponseSchema.parse(data.data)
	} catch (error) {
		handleApiError(error)
	}
}

async function createBusiness(dto: CreateBusinessDTO): Promise<BusinessResponse> {
	try {
		const { data } = await apiClient.post<ApiSuccessResponse<BusinessResponse>>(BASE_URL, dto)
		return businessResponseSchema.parse(data.data)
	} catch (error) {
		handleApiError(error)
	}
}

async function updateBusiness(id: number, dto: UpdateBusinessDTO): Promise<BusinessResponse> {
	try {
		const { data } = await apiClient.patch<ApiSuccessResponse<BusinessResponse>>(
			`${BASE_URL}/${id}`,
			dto,
		)
		return businessResponseSchema.parse(data.data)
	} catch (error) {
		handleApiError(error)
	}
}

async function deleteBusiness(id: number): Promise<void> {
	try {
		// Hard delete on the backend — there is no restore path.
		await apiClient.delete(`${BASE_URL}/${id}`)
	} catch (error) {
		handleApiError(error)
	}
}

async function setDefaultBusiness(id: number): Promise<BusinessResponse> {
	try {
		const { data } = await apiClient.patch<ApiSuccessResponse<BusinessResponse>>(
			`${BASE_URL}/${id}/default`,
		)
		return businessResponseSchema.parse(data.data)
	} catch (error) {
		handleApiError(error)
	}
}

async function uploadLogo(id: number, file: LogoUpload): Promise<BusinessResponse> {
	try {
		const formData = new FormData()
		// RN's FormData takes a {uri,name,type} descriptor rather than a File.
		formData.append('logo', file as unknown as Blob)

		const { data } = await apiClient.post<ApiSuccessResponse<BusinessResponse>>(
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

		return businessResponseSchema.parse(data.data)
	} catch (error) {
		handleApiError(error)
	}
}

async function deleteLogo(id: number): Promise<BusinessResponse> {
	try {
		const { data } = await apiClient.delete<ApiSuccessResponse<BusinessResponse>>(
			`${BASE_URL}/${id}/logo`,
		)
		return businessResponseSchema.parse(data.data)
	} catch (error) {
		handleApiError(error)
	}
}

export const businessesService = {
	list: listBusinesses,
	getById: getBusinessById,
	create: createBusiness,
	update: updateBusiness,
	delete: deleteBusiness,
	setDefault: setDefaultBusiness,
	uploadLogo,
	deleteLogo,
}
