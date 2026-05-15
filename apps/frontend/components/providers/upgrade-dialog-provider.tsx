"use client"

import { useEffect, useState } from "react"
import { upgradeDialogStore, type UpgradeDialogPayload } from "@/lib/upgrade-dialog/store"
import { UpgradeDialog } from "@/components/upgrade-dialog"

export function UpgradeDialogProvider({ children }: { children: React.ReactNode }) {
  const [payload, setPayload] = useState<UpgradeDialogPayload | null>(null)

  useEffect(() => upgradeDialogStore.subscribe(setPayload), [])

  return (
    <>
      {children}
      <UpgradeDialog payload={payload} onClose={() => setPayload(null)} />
    </>
  )
}
