import { useAuth } from '@clerk/expo'
import { router } from 'expo-router'
import { Pressable, View } from 'react-native'

import { Card, Screen, Text } from '@/components/ui'
import { BuildingIcon, ChevronRightIcon, LogOutIcon } from '@/components/ui/icons'

/**
 * Overflow tab. Grouped rows drilling into sub-screens rather than the web's
 * 1449-line tabbed configuration page.
 *
 * Only Companies exists today; Expenses, Payments, Catalog and Configuration
 * each add a row as their phase lands.
 */
export default function MoreScreen() {
	const { signOut } = useAuth()

	return (
		<Screen contentClassName="gap-6">
			<Card className="gap-0 p-0">
				<SettingsRow
					label="Companies"
					description="Business details, logo and invoice defaults"
					icon={<BuildingIcon size={20} color="#00a3ab" />}
					onPress={() => router.push('/(main)/more/businesses')}
				/>
			</Card>

			<Card className="gap-0 p-0">
				<SettingsRow
					label="Sign out"
					icon={<LogOutIcon size={20} color="#d40924" />}
					labelClassName="text-destructive"
					showChevron={false}
					onPress={() => void signOut()}
				/>
			</Card>
		</Screen>
	)
}

type SettingsRowProps = {
	label: string
	description?: string
	icon: React.ReactNode
	labelClassName?: string
	showChevron?: boolean
	onPress: () => void
}

function SettingsRow({
	label,
	description,
	icon,
	labelClassName,
	showChevron = true,
	onPress,
}: SettingsRowProps) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			onPress={onPress}
			// ui-styling: borderCurve pairs with every borderRadius.
			style={{ borderCurve: 'continuous' }}
			className="min-h-14 flex-row items-center gap-3 rounded-lg px-4 py-3"
		>
			<View
				style={{ borderCurve: 'continuous' }}
				className="h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted"
			>
				{icon}
			</View>

			<View className="min-w-0 flex-1 gap-0.5">
				<Text variant="label" className={labelClassName} numberOfLines={1}>
					{label}
				</Text>
				{description ? (
					<Text className="font-sans text-xs text-muted-foreground" numberOfLines={1}>
						{description}
					</Text>
				) : null}
			</View>

			{showChevron ? <ChevronRightIcon size={18} color="#58666a" /> : null}
		</Pressable>
	)
}
