import type { BusinessResponse, CreateBusinessDTO } from '@addinvoice/schemas'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ListBusinessesParams } from '@/features/businesses/schema/businesses.schema'
import {
	businessesService,
	type LogoUpload,
} from '@/features/businesses/service/businesses.service'
import { handleMutationError } from '@/lib/errors/handle-error'

export const businessKeys = {
	all: ['businesses'] as const,
	lists: () => [...businessKeys.all, 'list'] as const,
	list: (params?: ListBusinessesParams) => [...businessKeys.lists(), params ?? {}] as const,
	details: () => [...businessKeys.all, 'detail'] as const,
	detail: (id: number) => [...businessKeys.details(), id] as const,
}

export function useBusinesses(params?: ListBusinessesParams, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: businessKeys.list(params),
		queryFn: () => businessesService.list(params),
		staleTime: 5 * 60 * 1000,
		placeholderData: (prev) => prev,
		enabled: options?.enabled ?? true,
	})
}

export function useCreateBusiness() {
	const queryClient = useQueryClient()

	return useMutation<BusinessResponse, unknown, CreateBusinessDTO>({
		mutationFn: (dto) => businessesService.create(dto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: businessKeys.lists() }),
		onError: (error) => handleMutationError(error),
	})
}

export function useSetDefaultBusiness() {
	const queryClient = useQueryClient()

	return useMutation<BusinessResponse, unknown, number>({
		mutationFn: (id) => businessesService.setDefault(id),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: businessKeys.lists() }),
		onError: (error) => handleMutationError(error),
	})
}

export function useUploadBusinessLogo() {
	const queryClient = useQueryClient()

	return useMutation<BusinessResponse, unknown, { id: number; file: LogoUpload }>({
		mutationFn: ({ id, file }) => businessesService.uploadLogo(id, file),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: businessKeys.lists() }),
		onError: (error) => handleMutationError(error),
	})
}
