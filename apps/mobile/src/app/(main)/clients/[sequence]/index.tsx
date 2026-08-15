import { router, Stack, useLocalSearchParams } from 'expo-router'
import type { ReactNode } from 'react'
import { Linking, Pressable, View } from 'react-native'

import { EntityDeleteModal } from '@/components/shared/entity-delete-modal'
import { Badge, Button, Card, Divider, Screen, Spinner, Text } from '@/components/ui'
import {
	BriefcaseIcon,
	BuildingIcon,
	FileDigitIcon,
	MailIcon,
	MapPinIcon,
	PhoneIcon,
} from '@/components/ui/icons'
import { useClientDelete } from '@/features/clients/hooks/use-client-delete'
import { useClientBySequence } from '@/features/clients/hooks/use-clients'

export default function ClientDetailScreen() {
	const { sequence } = useLocalSearchParams<{ sequence: string }>()
	const clientSequence = Number(sequence)

	const { data: client, isLoading, isError, refetch } = useClientBySequence(clientSequence)
	// Leaves the detail screen once the row is gone; going `back` would land on a
	// list that no longer contains it, which is what we want.
	const clientDelete = useClientDelete({ onAfterDelete: () => router.back() })

	if (isError) {
		return (
			<Screen center>
				<View className="gap-2">
					<Text variant="title">Client not found</Text>
					<Text variant="muted">It may have been deleted, or your connection dropped.</Text>
				</View>
				<Button label="Retry" onPress={() => void refetch()} />
			</Screen>
		)
	}

	if (isLoading || !client) return <Spinner fullScreen />

	const hasReminders =
		client.reminderBeforeDueIntervalDays != null || client.reminderAfterDueIntervalDays != null

	return (
		<>
			<Stack.Screen options={{ title: client.name }} />

			<Screen contentClassName="gap-6">
				<View className="gap-2">
					{client.businessName ? <Badge label={client.businessName} tone="indigo" /> : null}
					<Text variant="heading">{client.name}</Text>
					<Text variant="muted">Client details and information</Text>
				</View>

				<View className="flex-row flex-wrap gap-2">
					<Button
						label="Edit"
						variant="outline"
						className="flex-1"
						onPress={() => router.push(`/(main)/clients/${client.sequence}/edit`)}
					/>
					{client.email ? (
						<Button
							label="Send Email"
							variant="outline"
							className="flex-1"
							onPress={() => void Linking.openURL(`mailto:${client.email}`)}
						/>
					) : null}
				</View>

				<Card className="gap-4">
					<View className="flex-row items-center gap-3">
						<View
							// ui-styling: borderCurve pairs with every borderRadius.
							style={{ borderCurve: 'continuous' }}
							className="h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary/20"
						>
							<BuildingIcon size={24} color="#00a3ab" />
						</View>
						<View className="min-w-0 flex-1 gap-0.5">
							<Text variant="title">Contact &amp; identification</Text>
							<Text className="font-sans text-sm text-muted-foreground">
								Basic details and contact information
							</Text>
						</View>
					</View>

					<Divider />

					<DetailRow
						icon={<MailIcon size={16} color="#58666a" />}
						label="Email"
						value={client.email}
						onPress={() => void Linking.openURL(`mailto:${client.email}`)}
					/>
					<DetailRow
						icon={<BriefcaseIcon size={16} color="#58666a" />}
						label="Business Name"
						value={client.businessName ?? 'N/A'}
					/>
					{client.phone ? (
						<DetailRow
							icon={<PhoneIcon size={16} color="#58666a" />}
							label="Phone"
							value={client.phone}
							onPress={() => void Linking.openURL(`tel:${client.phone}`)}
						/>
					) : null}
					<DetailRow
						icon={<MapPinIcon size={16} color="#58666a" />}
						label="Address"
						value={client.address ?? 'N/A'}
					/>
					<DetailRow
						icon={<FileDigitIcon size={16} color="#58666a" />}
						label="NIT / Tax ID"
						value={client.nit ?? 'N/A'}
					/>

					{hasReminders ? (
						<>
							<Divider />
							<View className="gap-1.5">
								<Text variant="label">Reminders</Text>
								{client.reminderBeforeDueIntervalDays != null ? (
									<Text variant="muted" className="text-sm">
										{`Before due: every ${client.reminderBeforeDueIntervalDays} day${
											client.reminderBeforeDueIntervalDays !== 1 ? 's' : ''
										}`}
									</Text>
								) : null}
								{client.reminderAfterDueIntervalDays != null ? (
									<Text variant="muted" className="text-sm">
										{`After due: every ${client.reminderAfterDueIntervalDays} day${
											client.reminderAfterDueIntervalDays !== 1 ? 's' : ''
										}`}
									</Text>
								) : null}
							</View>
						</>
					) : null}
				</Card>

				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`Delete ${client.name}`}
					onPress={() =>
						clientDelete.openDeleteModal({
							id: client.id,
							sequence: client.sequence,
							description: client.businessName || client.name,
						})
					}
					style={{ borderCurve: 'continuous' }}
					className="min-h-12 items-center justify-center rounded-lg border border-destructive/30 px-5 py-3"
				>
					<Text className="font-sans-semibold text-base text-destructive">Delete client</Text>
				</Pressable>
			</Screen>

			<EntityDeleteModal
				isOpen={clientDelete.isDeleteModalOpen}
				onClose={clientDelete.closeDeleteModal}
				onConfirm={clientDelete.handleDeleteConfirm}
				entity="client"
				entityName={clientDelete.clientToDelete?.description ?? client.name}
				isDeleting={clientDelete.isDeleting}
			/>
		</>
	)
}

function DetailRow({
	icon,
	label,
	value,
	onPress,
}: {
	icon: ReactNode
	label: string
	value: string
	onPress?: () => void
}) {
	const body = (
		<View className="flex-row items-start gap-3">
			<View className="pt-0.5">{icon}</View>
			<View className="min-w-0 flex-1 gap-0.5">
				<Text className="font-sans-medium text-sm text-muted-foreground">{label}</Text>
				<Text className={onPress ? 'text-primary' : ''}>{value}</Text>
			</View>
		</View>
	)

	if (!onPress) return body

	return (
		<Pressable accessibilityRole="link" accessibilityLabel={`${label}: ${value}`} onPress={onPress}>
			{body}
		</Pressable>
	)
}
