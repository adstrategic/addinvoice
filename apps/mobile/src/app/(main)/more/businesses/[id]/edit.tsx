import type { CreateBusinessDTO } from '@addinvoice/schemas'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'

import { Button, Card, Screen, Spinner, Text, View } from '@/components/ui'
import { CompanyForm, type LogoAction } from '@/features/businesses/forms/company-form'
import {
	useBusiness,
	useDeleteBusinessLogo,
	useUpdateBusiness,
	useUploadBusinessLogo,
} from '@/features/businesses/hooks/use-businesses'

export default function EditCompanyScreen() {
	const { id } = useLocalSearchParams<{ id: string }>()
	const businessId = Number(id)

	const { data: business, isLoading, isError, refetch } = useBusiness(businessId)
	const updateBusiness = useUpdateBusiness()
	const uploadLogo = useUploadBusinessLogo()
	const deleteLogo = useDeleteBusinessLogo()

	const [formError, setFormError] = useState<string | null>(null)

	const isBusy = updateBusiness.isPending || uploadLogo.isPending || deleteLogo.isPending

	async function handleSubmit(values: CreateBusinessDTO, logo: LogoAction) {
		setFormError(null)

		try {
			await updateBusiness.mutateAsync({ id: businessId, data: values })

			if (logo.type === 'upload') {
				await uploadLogo.mutateAsync({ id: businessId, file: logo.file })
			} else if (logo.type === 'remove') {
				await deleteLogo.mutateAsync(businessId)
			}

			router.back()
		} catch {
			// handleMutationError already toasted the specific reason.
			setFormError('We could not save your changes. Please try again.')
		}
	}

	if (isError) {
		return (
			<Screen center>
				<View className="gap-2">
					<Text variant="title">We couldn&apos;t load this company</Text>
					<Text variant="muted">Check your connection and try again.</Text>
				</View>
				<Button label="Retry" onPress={() => void refetch()} />
			</Screen>
		)
	}

	// CompanyForm reads its defaults once at mount — RichTextEditor captures its
	// document on the first render and will not accept a later value — so the
	// form must not mount until the record is here.
	if (isLoading || !business) {
		return <Spinner fullScreen />
	}

	return (
		<Screen avoidKeyboard contentClassName="gap-6">
			<Card className="gap-6 p-6">
				<CompanyForm
					mode="edit"
					// Remounts if the route is reused for a different business, so the
					// editors re-read their documents.
					key={business.id}
					logoRequired={false}
					initialLogoUrl={business.logo ?? null}
					defaultValues={{
						name: business.name,
						email: business.email,
						nit: business.nit ?? '',
						address: business.address,
						phone: business.phone,
						defaultTaxMode: business.defaultTaxMode ?? undefined,
						defaultTaxName: business.defaultTaxName ?? null,
						defaultTaxPercentage:
							business.defaultTaxPercentage != null
								? Number(business.defaultTaxPercentage)
								: null,
						defaultNotes: business.defaultNotes ?? null,
						defaultTerms: business.defaultTerms ?? null,
					}}
					submitLabel="Save changes"
					isSubmitting={isBusy}
					footer={formError ? <Text variant="error">{formError}</Text> : null}
					onSubmit={handleSubmit}
				/>
			</Card>
		</Screen>
	)
}
