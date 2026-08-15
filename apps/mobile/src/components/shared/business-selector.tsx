import type { BusinessResponse } from '@addinvoice/schemas'
import { Pressable, View } from 'react-native'

import { Image, Sheet, Spinner, Text } from '@/components/ui'
import { BuildingIcon } from '@/components/ui/icons'

export type BusinessSelectorProps = {
	isVisible: boolean
	businesses: BusinessResponse[]
	isLoading?: boolean
	onSelect: (business: BusinessResponse) => void
	onClose: () => void
	/** Web hardcodes "for this invoice" even on estimates; name the entity here. */
	entityLabel?: string
}

/**
 * Blocking business picker, shown before a document form opens.
 *
 * Mirrors the web's `business-selection-dialog.tsx`, which is the mechanism
 * invoices, estimates and catalog all use — not the in-form combobox, which
 * only catalog uses. Presentational: the caller owns fetching and selection
 * state via `useBusinessSelector`.
 */
export function BusinessSelector({
	isVisible,
	businesses,
	isLoading = false,
	onSelect,
	onClose,
	entityLabel = 'document',
}: BusinessSelectorProps) {
	return (
		<Sheet isVisible={isVisible} onClose={onClose} title="Select business">
			<Text variant="muted">
				Choose which business to use for this {entityLabel}. This selection is required.
			</Text>

			{isLoading ? (
				<Spinner />
			) : businesses.length === 0 ? (
				<View className="items-center gap-2 py-8">
					<BuildingIcon size={32} color="#58666a" />
					<Text variant="title">No businesses found</Text>
					<Text variant="muted" className="text-center">
						Please add a business first.
					</Text>
				</View>
			) : (
				<View className="gap-3">
					{businesses.map((business) => (
						<Pressable
							key={business.id}
							accessibilityRole="button"
							accessibilityLabel={business.name}
							onPress={() => onSelect(business)}
							style={{ borderCurve: 'continuous' }}
							className="flex-row items-center gap-4 rounded-lg border border-input bg-card p-4"
						>
							<View
								style={{ borderCurve: 'continuous' }}
								className="h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-primary/20"
							>
								{business.logo ? (
									<Image
										source={{ uri: business.logo }}
										style={{ width: '100%', height: '100%' }}
										contentFit="cover"
										recyclingKey={business.logo}
									/>
								) : (
									<BuildingIcon size={24} color="#00a3ab" />
								)}
							</View>

							<View className="min-w-0 flex-1 gap-0.5">
								<Text variant="label" numberOfLines={1}>
									{business.name}
								</Text>
								<Text
									className="font-sans text-sm text-muted-foreground"
									numberOfLines={1}
								>
									{business.email}
								</Text>
								{business.isDefault ? (
									<Text className="font-sans-medium text-xs text-primary">Default</Text>
								) : null}
							</View>
						</Pressable>
					))}
				</View>
			)}
		</Sheet>
	)
}
