import type {
	BusinessResponse,
	CreateBusinessDTO,
	UpdateBusinessDTO,
} from '@addinvoice/schemas'
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

export function useBusiness(id: number | null, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: businessKeys.detail(id ?? 0),
		queryFn: () => businessesService.getById(id as number),
		staleTime: 5 * 60 * 1000,
		enabled: (options?.enabled ?? true) && id != null,
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

export function useUpdateBusiness() {
	const queryClient = useQueryClient()

	return useMutation<BusinessResponse, unknown, { id: number; data: UpdateBusinessDTO }>({
		mutationFn: ({ id, data }) => businessesService.update(id, data),
		onSuccess: (_result, { id }) => {
			queryClient.invalidateQueries({ queryKey: businessKeys.lists() })
			queryClient.invalidateQueries({ queryKey: businessKeys.detail(id) })
		},
		onError: (error) => handleMutationError(error),
	})
}

export function useDeleteBusiness() {
	const queryClient = useQueryClient()

	return useMutation<void, unknown, number>({
		mutationFn: (id) => businessesService.delete(id),
		onSuccess: (_result, id) => {
			queryClient.invalidateQueries({ queryKey: businessKeys.lists() })
			// The web forgets this one, leaving a detail query for a row that no
			// longer exists. Remove rather than invalidate — refetching a deleted
			// business just produces a 404.
			queryClient.removeQueries({ queryKey: businessKeys.detail(id) })
		},
		onError: (error) => handleMutationError(error),
	})
}

export function useSetDefaultBusiness() {
	const queryClient = useQueryClient()

	return useMutation<BusinessResponse, unknown, number>({
		mutationFn: (id) => businessesService.setDefault(id),
		onSuccess: (_result, id) => {
			// The backend unsets isDefault on every other business in the same
			// transaction, so the whole list is stale, not just this row.
			queryClient.invalidateQueries({ queryKey: businessKeys.lists() })
			queryClient.invalidateQueries({ queryKey: businessKeys.detail(id) })
		},
		onError: (error) => handleMutationError(error),
	})
}

export function useUploadBusinessLogo() {
	const queryClient = useQueryClient()

	return useMutation<BusinessResponse, unknown, { id: number; file: LogoUpload }>({
		mutationFn: ({ id, file }) => businessesService.uploadLogo(id, file),
		onSuccess: (_result, { id }) => {
			queryClient.invalidateQueries({ queryKey: businessKeys.lists() })
			queryClient.invalidateQueries({ queryKey: businessKeys.detail(id) })
		},
		onError: (error) => handleMutationError(error),
	})
}

export function useDeleteBusinessLogo() {
	const queryClient = useQueryClient()

	return useMutation<BusinessResponse, unknown, number>({
		mutationFn: (id) => businessesService.deleteLogo(id),
		onSuccess: (_result, id) => {
			queryClient.invalidateQueries({ queryKey: businessKeys.lists() })
			queryClient.invalidateQueries({ queryKey: businessKeys.detail(id) })
		},
		onError: (error) => handleMutationError(error),
	})
}
