import { useCallback, useState } from 'react'

import { useDeleteClient } from '@/features/clients/hooks/use-clients'

export type ClientToDelete = {
	id: number
	sequence: number
	/** Business name when set, client name otherwise — matches the web's modal copy. */
	description: string
}

/**
 * Headless delete state. The confirmation UI lives in the screen, matching how
 * the web splits `useClientDelete` from the dialog it drives.
 */
export function useClientDelete(options?: { onAfterDelete?: () => void }) {
	const deleteClient = useDeleteClient()
	const [clientToDelete, setClientToDelete] = useState<ClientToDelete | null>(null)

	// Wrapped so the list screen can depend on `openDeleteModal` alone and keep
	// its `renderItem` identity stable — a callback that changes every render
	// would re-render every visible row and defeat FlashList recycling
	// (list-performance-function-references).
	const openDeleteModal = useCallback((client: ClientToDelete) => {
		setClientToDelete(client)
	}, [])

	const closeDeleteModal = useCallback(() => {
		setClientToDelete(null)
	}, [])

	function handleDeleteConfirm() {
		if (!clientToDelete) return

		deleteClient.mutate(
			{ id: clientToDelete.id, sequence: clientToDelete.sequence },
			{
				// Only closes on success. On failure the sheet stays open with the
				// toast from handleMutationError, so the user can retry or cancel.
				onSuccess: () => {
					closeDeleteModal()
					options?.onAfterDelete?.()
				},
			},
		)
	}

	return {
		isDeleteModalOpen: clientToDelete != null,
		clientToDelete,
		openDeleteModal,
		closeDeleteModal,
		handleDeleteConfirm,
		isDeleting: deleteClient.isPending,
	}
}
