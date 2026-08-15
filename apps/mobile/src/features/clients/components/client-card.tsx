import { memo } from 'react'
import { Pressable, View } from 'react-native'

import type { PopoverAnchor } from '@/components/shared/popover-menu'
import { Card, Image, Text } from '@/components/ui'
import { BuildingIcon, MailIcon, PhoneIcon } from '@/components/ui/icons'
import { getClientDisplayLines } from '@/features/clients/client-display'
import { ClientMenuTrigger } from '@/features/clients/components/client-menu-trigger'

/**
 * list-performance-inline-objects: hoisted so `renderItem` never allocates a
 * fresh style object per row.
 */
const CARD_STYLE = {
	// The web variant is `border-l-[3px] border-l-indigo-500` from
	// components/shared/list-card-theme.ts. NativeWind has no per-side border
	// width utility, so it is expressed as a style.
	borderLeftWidth: 3,
	borderLeftColor: '#6366f1',
	borderCurve: 'continuous',
} as const

const AVATAR_STYLE = { borderCurve: 'continuous' } as const
const IMAGE_STYLE = { width: '100%', height: '100%' } as const

/**
 * One row of the clients list.
 *
 * Primitive props only, so `memo`'s shallow compare actually works
 * (list-performance-item-memo). Callbacks take the sequence rather than the
 * record, so one handler set is created at the list root instead of one per row
 * (list-performance-callbacks).
 */
export type ClientCardProps = {
	sequence: number
	name: string
	businessName: string | null
	email: string
	phone: string | null
	logo: string | null
	onPress: (sequence: number) => void
	onOpenMenu: (sequence: number, anchor: PopoverAnchor) => void
}

export const ClientCard = memo(function ClientCard({
	sequence,
	name,
	businessName,
	email,
	phone,
	logo,
	onPress,
	onOpenMenu,
}: ClientCardProps) {
	const display = getClientDisplayLines({ name, businessName })
	const hasContactRow = email.length > 0 || (phone != null && phone.length > 0)

	return (
		<Card style={CARD_STYLE} className="gap-3">
			<View className="flex-row items-center gap-3">
				<Pressable
					accessibilityRole="button"
					accessibilityLabel={`View ${display.name}`}
					onPress={() => onPress(sequence)}
					className="min-w-0 flex-1 flex-row items-center gap-3"
				>
					<View
						style={AVATAR_STYLE}
						className="h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-500/10"
					>
						{logo ? (
							<Image
								source={{ uri: logo }}
								style={IMAGE_STYLE}
								contentFit="cover"
								// ui-expo-image / list-performance-images: the recycling key
								// tells expo-image this view is now showing a different
								// image, so a recycled row cannot flash the previous logo.
								recyclingKey={logo}
							/>
						) : (
							<BuildingIcon size={20} color="#4f46e5" />
						)}
					</View>

					<View className="min-w-0 flex-1 gap-0.5">
						<Text variant="title" numberOfLines={1}>
							{display.name}
						</Text>
						{display.businessName ? (
							<Text className="font-sans-medium text-sm text-foreground" numberOfLines={1}>
								{display.businessName}
							</Text>
						) : null}
					</View>
				</Pressable>

				<ClientMenuTrigger sequence={sequence} onOpenMenu={onOpenMenu} />
			</View>

			{hasContactRow ? (
				<View className="gap-1.5 border-t border-indigo-500/15 pt-2.5">
					{email ? (
						<View className="flex-row items-center gap-1.5">
							<MailIcon size={14} color="#58666a" />
							<Text className="font-sans text-xs text-muted-foreground">Email</Text>
							<Text
								className="min-w-0 flex-1 font-sans-medium text-xs text-foreground"
								numberOfLines={1}
							>
								{email}
							</Text>
						</View>
					) : null}

					{phone ? (
						<View className="flex-row items-center gap-1.5">
							<PhoneIcon size={14} color="#58666a" />
							<Text className="font-sans-medium text-xs text-foreground" numberOfLines={1}>
								{phone}
							</Text>
						</View>
					) : null}
				</View>
			) : null}
		</Card>
	)
})
