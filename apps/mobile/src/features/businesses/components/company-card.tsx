import { memo } from 'react'
import { Pressable, View } from 'react-native'

import { Card, Image, Text } from '@/components/ui'
import { BuildingIcon } from '@/components/ui/icons'

/**
 * Primitive props only, so `memo`'s shallow compare actually works
 * (`list-performance-item-memo`). Callbacks take the id rather than the record,
 * so one handler is created at the list root instead of one per row.
 */
export type CompanyCardProps = {
	id: number
	name: string
	email: string
	address: string
	logo: string | null
	isDefault: boolean
	/** False when this is the only business left — deleting it breaks the funnel. */
	canDelete: boolean
	onPress: (id: number) => void
	onSetDefault: (id: number) => void
	onDelete: (id: number) => void
	isBusy?: boolean
}

/**
 * Read-only summary that drills into the edit route.
 *
 * Deliberately not a port of the web's `CompanyCard`, which is a full inline
 * edit form per business. That shape would mount two WebViews per row here,
 * since `CompanyForm` keeps both rich-text editors inline.
 */
export const CompanyCard = memo(function CompanyCard({
	id,
	name,
	email,
	address,
	logo,
	isDefault,
	canDelete,
	onPress,
	onSetDefault,
	onDelete,
	isBusy = false,
}: CompanyCardProps) {
	return (
		<Card className="gap-4">
			<Pressable
				accessibilityRole="button"
				accessibilityLabel={`Edit ${name}`}
				onPress={() => onPress(id)}
				className="flex-row items-center gap-4"
			>
				<View
					style={{ borderCurve: 'continuous' }}
					className="h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-primary/20"
				>
					{logo ? (
						<Image
							source={{ uri: logo }}
							style={{ width: '100%', height: '100%' }}
							contentFit="cover"
							recyclingKey={logo}
						/>
					) : (
						<BuildingIcon size={28} color="#00a3ab" />
					)}
				</View>

				<View className="min-w-0 flex-1 gap-0.5">
					<Text variant="title" numberOfLines={1}>
						{name}
					</Text>
					<Text className="font-sans text-sm text-muted-foreground" numberOfLines={1}>
						{email}
					</Text>
					<Text className="font-sans text-sm text-muted-foreground" numberOfLines={1}>
						{address}
					</Text>
					{isDefault ? (
						<Text className="mt-1 font-sans-medium text-xs text-primary">
							Default Company
						</Text>
					) : null}
				</View>
			</Pressable>

			<View className="flex-row items-center justify-end gap-2">
				{isDefault ? null : (
					<Pressable
						accessibilityRole="button"
						disabled={isBusy}
						onPress={() => onSetDefault(id)}
						style={{ borderCurve: 'continuous' }}
						className={`min-h-10 justify-center rounded-lg border border-border px-4 py-2 ${
							isBusy ? 'opacity-50' : ''
						}`}
					>
						<Text className="font-sans-medium text-sm text-foreground">Set as default</Text>
					</Pressable>
				)}

				<Pressable
					accessibilityRole="button"
					accessibilityState={{ disabled: !canDelete || isBusy }}
					disabled={!canDelete || isBusy}
					onPress={() => onDelete(id)}
					className={`min-h-10 justify-center px-3 py-2 ${!canDelete || isBusy ? 'opacity-40' : ''}`}
				>
					<Text className="font-sans-medium text-sm text-destructive">Delete</Text>
				</Pressable>
			</View>

			{canDelete ? null : (
				<Text className="font-sans text-xs text-muted-foreground">
					You need at least one business. Add another before deleting this one.
				</Text>
			)}
		</Card>
	)
})
