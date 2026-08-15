import type { CreateBusinessDTO } from '@addinvoice/schemas'
import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'

import { FunnelGuard } from '@/components/guards/funnel-guard'
import { Card, Screen, Text } from '@/components/ui'
import { BuildingIcon } from '@/components/ui/icons'
import { CompanyForm, type LogoAction } from '@/features/businesses/forms/company-form'
import {
	useCreateBusiness,
	useSetDefaultBusiness,
	useUploadBusinessLogo,
} from '@/features/businesses/hooks/use-businesses'
import { SETUP_DEFAULT_NOTES, SETUP_DEFAULT_TERMS } from '@/features/businesses/setup-defaults'

export default function SetupScreen() {
	const createBusiness = useCreateBusiness()
	const setDefaultBusiness = useSetDefaultBusiness()
	const uploadLogo = useUploadBusinessLogo()

	const [formError, setFormError] = useState<string | null>(null)
	// Set once the business exists, so a failed logo upload retries only the
	// upload instead of creating a second business.
	const [createdBusinessId, setCreatedBusinessId] = useState<number | null>(null)

	const isBusy = createBusiness.isPending || setDefaultBusiness.isPending || uploadLogo.isPending

	async function handleSubmit(values: CreateBusinessDTO, logo: LogoAction) {
		setFormError(null)

		try {
			let businessId = createdBusinessId

			if (businessId == null) {
				const business = await createBusiness.mutateAsync(values)
				businessId = business.id
				setCreatedBusinessId(business.id)
				// The backend always creates with isDefault:false; the first business
				// has to be promoted explicitly or nothing is ever the default.
				await setDefaultBusiness.mutateAsync(business.id)
			}

			// CompanyForm enforces logoRequired, so this is always an upload here.
			if (logo.type === 'upload') {
				await uploadLogo.mutateAsync({ id: businessId, file: logo.file })
			}

			router.replace('/(main)/clients')
		} catch {
			// handleMutationError already toasted the specific reason.
			setFormError(
				createdBusinessId == null
					? 'We could not create your business. Please check the fields and try again.'
					: 'Your business was created but the logo did not upload. Tap to retry the upload.',
			)
		}
	}

	return (
		<FunnelGuard requiredStep="setup">
			<Screen avoidKeyboard contentClassName="gap-8">
				<View className="items-center gap-2">
					<View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-primary/20">
						<BuildingIcon size={32} color="#00a3ab" />
					</View>
					<Text className="text-center font-sans-bold text-3xl leading-tight text-foreground">
						Welcome! Let&apos;s set up your business
					</Text>
					<Text className="text-center font-sans text-base text-muted-foreground">
						We need some basic information to get you started with invoicing
					</Text>
				</View>

				<Card className="gap-6 p-6">
					<View className="gap-1.5">
						<Text variant="title">Business Information</Text>
						<Text className="font-sans text-sm text-muted-foreground">
							Enter your business details. You can update these later in settings.
						</Text>
					</View>

					<CompanyForm
						mode="create"
						logoRequired
						defaultValues={{
							defaultNotes: SETUP_DEFAULT_NOTES,
							defaultTerms: SETUP_DEFAULT_TERMS,
						}}
						submitLabel={createdBusinessId == null ? 'Complete Setup' : 'Retry logo upload'}
						submittingLabel="Setting up..."
						isSubmitting={isBusy}
						footer={formError ? <Text variant="error">{formError}</Text> : null}
						onSubmit={handleSubmit}
					/>
				</Card>
			</Screen>
		</FunnelGuard>
	)
}
