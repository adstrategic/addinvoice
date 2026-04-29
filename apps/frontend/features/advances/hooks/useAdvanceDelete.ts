"use client"

import { useState } from "react"
import { useDeleteAdvance } from "./useAdvances"
import type { AdvanceListItemResponse } from "@addinvoice/schemas"

interface UseAdvanceDeleteOptions {
  onAfterDelete?: () => void
}

export function useAdvanceDelete(options?: UseAdvanceDeleteOptions) {
  const deleteMutation = useDeleteAdvance()

  // State for delete modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [advanceToDelete, setAdvanceToDelete] = useState<{
    id: number
    label: string
  } | null>(null)

  const openDeleteModal = (advance: AdvanceListItemResponse) => {
    setAdvanceToDelete({
      id: advance.id,
      label: advance.projectName,
    })
    setIsDeleteModalOpen(true)
  }

  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setAdvanceToDelete(null)
  }

  const handleDeleteConfirm = () => {
    if (!advanceToDelete) return

    deleteMutation.mutate(
      {
        id: advanceToDelete.id,
      },
      {
        onSuccess: () => {
          closeDeleteModal()
          options?.onAfterDelete?.()
        },
      },
    )
  }

  return {
    isDeleteModalOpen,
    advanceToDelete,
    openDeleteModal,
    closeDeleteModal,
    handleDeleteConfirm,
    isDeleting: deleteMutation.isPending,
  }
}
