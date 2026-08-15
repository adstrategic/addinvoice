import type { CreateClientDTO, UpdateClientDTO } from '@addinvoice/schemas'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'

import { Button, Card, Screen, Spinner, Text } from '@/components/ui'
import { ClientForm, type LogoAction } from '@/features/clients/forms/client-form'
import {
	useClientBySequence,
	useUpdateClient,
	useUploadClientLogo,
} from '@/features/clients/hooks/use-clients'

export default function EditClientScreen() {
	const { sequence } = useLocalSearchParams<{ sequence: string }>()
	const clientSequence = Number(sequence)

	const { data: client, isLoading, isError, refetch } = useClientBySequence(clientSequence)
	const updateClient = useUpdateClient()
	const uploadLogo = useUploadClientLogo()
	const [formError, setFormError] = useState<string | null>(null)
	const isBusy = updateClient.isPending || uploadLogo.isPending

	async function handleSubmit(
		_values: CreateClientDTO,
		dirty: UpdateClientDTO,
		logo: LogoAction,
	) {
		if (!client) return
		setFormError(null)

		try {
			// Only what changed. Re-sending an untouched empty phone would be
			// harmless, but re-sending a populated field the user never opened can
			// clobber a concurrent edit.
			if (Object.keys(dirty).length > 0) {
				await updateClient.mutateAsync({ id: client.id, data: dirty })
			}

			if (logo.type === 'upload') {
				await uploadLogo.mutateAsync({ id: client.id, file: logo.file })
			}

			router.back()
		} catch {
			setFormError('We could not save your changes. Please try again.')
		}
	}

	if (isError) {
		return (
			<Screen center>
				<View className="gap-2">
					<Text variant="title">We couldn&apos;t load this client</Text>
					<Text variant="muted">Check your connection and try again.</Text>
				</View>
				<Button label="Retry" onPress={() => void refetch()} />
			</Screen>
		)
	}

	// ClientForm reads its defaults once at mount, so the form must not render
	// until the record is here.
	if (isLoading || !client) return <Spinner fullScreen />

	return (
		<Screen avoidKeyboard contentClassName="gap-6">
			<Card className="gap-6 p-6">
				<ClientForm
					mode="edit"
					key={client.id}
					initialLogoUrl={client.logo ?? null}
					defaultValues={{
						name: client.name,
						email: client.email,
						phone: client.phone ?? '',
						address: client.address ?? '',
						nit: client.nit ?? '',
						businessName: client.businessName ?? '',
						reminderBeforeDueIntervalDays: client.reminderBeforeDueIntervalDays ?? null,
						reminderAfterDueIntervalDays: client.reminderAfterDueIntervalDays ?? null,
					}}
					submitLabel="Update Client"
					submittingLabel="Saving..."
					isSubmitting={isBusy}
					onCancel={() => router.back()}
					footer={formError ? <Text variant="error">{formError}</Text> : null}
					onSubmit={handleSubmit}
				/>
			</Card>
		</Screen>
	)
}
