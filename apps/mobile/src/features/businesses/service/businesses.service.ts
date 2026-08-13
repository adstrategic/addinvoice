import {
	businessResponseSchema,
	type BusinessResponse,
	type CreateBusinessDTO,
} from '@addinvoice/schemas'

import {
	businessResponseListSchema,
	type BusinessResponseList,
	type ListBusinessesParams,
} from '@/features/businesses/schema/businesses.schema'
import { apiClient } from '@/lib/api/client'
import type { ApiSuccessResponse } from '@/lib/api/types'
import { handleApiError } from '@/lib/errors/handler'

const BASE_URL = '/businesses'

/** A photo chosen with expo-image-picker, in the shape RN's FormData expects. */
export type LogoUpload = {
	uri: string
	name: string
	type: string
}

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

async function createBusiness(dto: CreateBusinessDTO): Promise<BusinessResponse> {
	try {
		const { data } = await apiClient.post<ApiSuccessResponse<BusinessResponse>>(BASE_URL, dto)
		return businessResponseSchema.parse(data.data)
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
			// Content-Type is left unset on purpose: RN must generate the multipart
			// boundary itself, and setting the header by hand omits it.
			{ headers: { 'Content-Type': undefined } },
		)

		return businessResponseSchema.parse(data.data)
	} catch (error) {
		handleApiError(error)
	}
}

export const businessesService = {
	list: listBusinesses,
	create: createBusiness,
	setDefault: setDefaultBusiness,
	uploadLogo,
}
