import type { ClientResponse, CreateClientDTO, UpdateClientDTO } from '@addinvoice/schemas'
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'

import type { ClientResponseList } from '@/features/clients/schema/clients.schema'
import { clientsService } from '@/features/clients/service/clients.service'
import type { LogoUpload } from '@/lib/api/types'
import { handleMutationError } from '@/lib/errors/handle-error'

/** The API caps `limit` at 30; 20 keeps each page well under a screenful of work. */
const PAGE_SIZE = 20

export const clientKeys = {
	all: ['clients'] as const,
	lists: () => [...clientKeys.all, 'list'] as const,
	list: (search?: string) => [...clientKeys.lists(), { search: search ?? '' }] as const,
	details: () => [...clientKeys.all, 'detail'] as const,
	detail: (id: number) => [...clientKeys.details(), id] as const,
	// Reads are by sequence, writes are by id, so both live in the factory.
	bySequence: (sequence: number) => [...clientKeys.details(), 'sequence', sequence] as const,
}

/**
 * Replaces the web's numbered pagination with infinite scroll. `stats` rides
 * along on every page, so the list header reads it off page 0.
 */
export function useClientsInfinite(search?: string) {
	return useInfiniteQuery({
		queryKey: clientKeys.list(search),
		queryFn: ({ pageParam }) =>
			clientsService.list({ page: pageParam, limit: PAGE_SIZE, search: search || undefined }),
		initialPageParam: 1,
		getNextPageParam: (lastPage: ClientResponseList) => {
			const { page, totalPages } = lastPage.pagination
			return page < totalPages ? page + 1 : undefined
		},
		staleTime: 30 * 1000,
	})
}

export function useClientBySequence(sequence: number | null, options?: { enabled?: boolean }) {
	return useQuery({
		queryKey: clientKeys.bySequence(sequence ?? 0),
		queryFn: () => clientsService.getBySequence(sequence as number),
		staleTime: 5 * 60 * 1000,
		enabled: (options?.enabled ?? true) && sequence != null,
	})
}

export function useCreateClient() {
	const queryClient = useQueryClient()

	return useMutation<ClientResponse, unknown, CreateClientDTO>({
		mutationFn: (dto) => clientsService.create(dto),
		onSuccess: () => queryClient.invalidateQueries({ queryKey: clientKeys.lists() }),
		onError: (error) => handleMutationError(error),
	})
}

export function useUpdateClient() {
	const queryClient = useQueryClient()

	return useMutation<ClientResponse, unknown, { id: number; data: UpdateClientDTO }>({
		mutationFn: ({ id, data }) => clientsService.update(id, data),
		onSuccess: (result, { id }) => {
			queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
			queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) })
			// The detail screen is keyed by sequence, which the response carries.
			queryClient.invalidateQueries({ queryKey: clientKeys.bySequence(result.sequence) })
		},
		onError: (error) => handleMutationError(error),
	})
}

export function useDeleteClient() {
	const queryClient = useQueryClient()

	return useMutation<void, unknown, { id: number; sequence: number }>({
		mutationFn: ({ id }) => clientsService.delete(id),
		onSuccess: (_result, { id, sequence }) => {
			queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
			// Remove rather than invalidate — refetching a deleted client is a 404.
			queryClient.removeQueries({ queryKey: clientKeys.detail(id) })
			queryClient.removeQueries({ queryKey: clientKeys.bySequence(sequence) })
		},
		onError: (error) => handleMutationError(error),
	})
}

export function useUploadClientLogo() {
	const queryClient = useQueryClient()

	return useMutation<ClientResponse, unknown, { id: number; file: LogoUpload }>({
		mutationFn: ({ id, file }) => clientsService.uploadLogo(id, file),
		onSuccess: (result, { id }) => {
			queryClient.invalidateQueries({ queryKey: clientKeys.lists() })
			queryClient.invalidateQueries({ queryKey: clientKeys.detail(id) })
			queryClient.invalidateQueries({ queryKey: clientKeys.bySequence(result.sequence) })
		},
		onError: (error) => handleMutationError(error),
	})
}
