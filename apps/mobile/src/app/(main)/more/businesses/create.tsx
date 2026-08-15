import type { CreateBusinessDTO } from '@addinvoice/schemas'
import { router } from 'expo-router'
import { useState } from 'react'

import { Card, Screen, Text } from '@/components/ui'
import { CompanyForm, type LogoAction } from '@/features/businesses/forms/company-form'
import {
	useCreateBusiness,
	useUploadBusinessLogo,
} from '@/features/businesses/hooks/use-businesses'

export default function CreateCompanyScreen() {
	const createBusiness = useCreateBusiness()
	const uploadLogo = useUploadBusinessLogo()

	const [formError, setFormError] = useState<string | null>(null)
	// The web's CreateCompanyDialog has a bug here: a failed logo upload leaves
	// the business created but the dialog open, so resubmitting creates a
	// duplicate. Remembering the id means a retry only retries the upload.
	const [createdBusinessId, setCreatedBusinessId] = useState<number | null>(null)

	const isBusy = createBusiness.isPending || uploadLogo.isPending

	async function handleSubmit(values: CreateBusinessDTO, logo: LogoAction) {
		setFormError(null)

		try {
			let businessId = createdBusinessId

			if (businessId == null) {
				const business = await createBusiness.mutateAsync(values)
				businessId = business.id
				setCreatedBusinessId(business.id)
			}

			if (logo.type === 'upload') {
				await uploadLogo.mutateAsync({ id: businessId, file: logo.file })
			}

			router.back()
		} catch {
			// handleMutationError already toasted the specific reason.
			setFormError(
				createdBusinessId == null
					? 'We could not create this company. Please check the fields and try again.'
					: 'The company was created but the logo did not upload. Tap to retry the upload.',
			)
		}
	}

	return (
		<Screen avoidKeyboard contentClassName="gap-6">
			<Card className="gap-6 p-6">
				<Text className="font-sans text-sm text-muted-foreground">
					Add a new company. Set invoice defaults and upload a logo below.
				</Text>

				<CompanyForm
					mode="create"
					logoRequired
					submitLabel={createdBusinessId == null ? 'Create' : 'Retry logo upload'}
					submittingLabel="Creating..."
					isSubmitting={isBusy}
					footer={formError ? <Text variant="error">{formError}</Text> : null}
					onSubmit={handleSubmit}
				/>
			</Card>
		</Screen>
	)
}
