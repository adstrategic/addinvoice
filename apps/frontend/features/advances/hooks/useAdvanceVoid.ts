"use client"

import { useState } from "react"
import type { AdvanceListItemResponse } from "@addinvoice/schemas"
import { useVoidAdvance } from "./useAdvances"

interface UseAdvanceVoidOptions {
  onAfterVoid?: () => void
}

export function useAdvanceVoid(options?: UseAdvanceVoidOptions) {
  const voidMutation = useVoidAdvance()

  const [isVoidModalOpen, setIsVoidModalOpen] = useState(false)
  const [advanceToVoid, setAdvanceToVoid] = useState<{
    id: number
    label: string
    sequence: number
  } | null>(null)

  const openVoidModal = (advance: AdvanceListItemResponse) => {
    setAdvanceToVoid({
      id: advance.id,
      label: advance.projectName,
      sequence: advance.sequence,
    })
    setIsVoidModalOpen(true)
  }

  const closeVoidModal = () => {
    setIsVoidModalOpen(false)
    setAdvanceToVoid(null)
  }

  const handleVoidConfirm = () => {
    if (!advanceToVoid) return

    voidMutation.mutate(
      { id: advanceToVoid.id, sequence: advanceToVoid.sequence },
      {
        onSuccess: () => {
          closeVoidModal()
          options?.onAfterVoid?.()
        },
      },
    )
  }

  return {
    isVoidModalOpen,
    advanceToVoid,
    openVoidModal,
    closeVoidModal,
    handleVoidConfirm,
    isVoiding: voidMutation.isPending,
  }
}
