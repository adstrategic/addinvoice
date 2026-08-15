import { useState } from 'react'

import { useDeleteBusiness } from '@/features/businesses/hooks/use-businesses'

export type BusinessToDelete = { id: number; name: string }

/**
 * Headless delete state. The confirmation UI lives in the screen, matching how
 * the web splits `useBusinessDelete` from the dialog it drives.
 */
export function useBusinessDelete(options?: { onAfterDelete?: () => void }) {
	const deleteBusiness = useDeleteBusiness()
	const [businessToDelete, setBusinessToDelete] = useState<BusinessToDelete | null>(null)

	function openDeleteModal(business: BusinessToDelete) {
		setBusinessToDelete(business)
	}

	function closeDeleteModal() {
		setBusinessToDelete(null)
	}

	function handleDeleteConfirm() {
		if (!businessToDelete) return

		deleteBusiness.mutate(businessToDelete.id, {
			// Only closes on success. On failure the sheet stays open with the
			// toast from handleMutationError, so the user can retry or cancel.
			onSuccess: () => {
				closeDeleteModal()
				options?.onAfterDelete?.()
			},
		})
	}

	return {
		isDeleteModalOpen: businessToDelete != null,
		businessToDelete,
		openDeleteModal,
		closeDeleteModal,
		handleDeleteConfirm,
		isDeleting: deleteBusiness.isPending,
	}
}
