import type { CreateClientDTO } from '@addinvoice/schemas'
import { router } from 'expo-router'
import { useState } from 'react'

import { Card, Screen, Text } from '@/components/ui'
import { ClientForm, type LogoAction } from '@/features/clients/forms/client-form'
import { useCreateClient, useUploadClientLogo } from '@/features/clients/hooks/use-clients'

export default function CreateClientScreen() {
	const createClient = useCreateClient()
	const uploadLogo = useUploadClientLogo()
	const [formError, setFormError] = useState<string | null>(null)
	// The logo is a second request, so a network failure between the two would
	// otherwise leave the client created and a resubmit would duplicate it.
	// Remembering the id means a retry only retries the upload.
	const [createdClientId, setCreatedClientId] = useState<number | null>(null)
	const isBusy = createClient.isPending || uploadLogo.isPending

	async function handleSubmit(values: CreateClientDTO, _dirty: unknown, logo: LogoAction) {
		setFormError(null)

		try {
			let clientId = createdClientId

			if (clientId == null) {
				const client = await createClient.mutateAsync(values)
				clientId = client.id
				setCreatedClientId(client.id)
			}

			if (logo.type === 'upload') {
				await uploadLogo.mutateAsync({ id: clientId, file: logo.file })
			}

			router.back()
		} catch {
			// handleMutationError already toasted the specific reason.
			setFormError(
				createdClientId == null
					? 'We could not create this client. Please check the fields and try again.'
					: 'The client was created but the logo did not upload. Tap to retry the upload.',
			)
		}
	}

	return (
		<Screen avoidKeyboard contentClassName="gap-6">
			<Card className="gap-6 p-6">
				<ClientForm
					mode="create"
					submitLabel={createdClientId == null ? 'Create Client' : 'Retry logo upload'}
					submittingLabel="Creating..."
					isSubmitting={isBusy}
					onCancel={() => router.back()}
					footer={formError ? <Text variant="error">{formError}</Text> : null}
					onSubmit={handleSubmit}
				/>
			</Card>
		</Screen>
	)
}
