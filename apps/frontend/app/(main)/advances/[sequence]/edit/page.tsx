"use client"

import LoadingComponent from "@/components/loading-component"
import { AdvanceForm } from "@/features/advances/forms/AdvancesForm"
import { useAdvanceManager } from "@/features/advances/hooks/useAdvancesFormManager"
import { useParams, useRouter } from "next/navigation"

export default function EditAdvancePage() {
	const { sequence } = useParams<{ sequence: string }>()
	const router = useRouter()
	const advanceManager = useAdvanceManager({
		mode: "edit",
		sequence: sequence ? parseInt(sequence, 10) : undefined,
	})

	if (
		advanceManager.isLoadingBusinesses ||
		(advanceManager.mode === "edit" && advanceManager.isLoadingAdvance)
	) {
		return <LoadingComponent variant="form" rows={8} />
	}

	if (advanceManager.selectedBusiness) {
		return (
			<AdvanceForm
				form={advanceManager.form}
				mode={advanceManager.mode}
				images={advanceManager.images}
				isLoading={advanceManager.isMutating}
				isLoadingAdvance={advanceManager.isLoadingAdvance}
				existingAdvance={advanceManager.advance}
				selectedBusiness={advanceManager.selectedBusiness}
				createdClient={advanceManager.createdClient}
				saveBeforeSend={advanceManager.saveBeforeSend}
				onAddImages={advanceManager.addImages}
				onRemoveImage={advanceManager.removeImage}
				onSubmit={advanceManager.onSubmit}
				onCancel={() => router.push("/advances")}
			/>
		)
	}
}
