import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

/**
 * Height the native tab bar occupies above the bottom safe-area inset.
 *
 * expo-router's native tabs expose no `useBottomTabBarHeight`, and absolutely
 * positioned siblings are not covered by the automatic content insets it
 * applies to scroll views — so the offset is a constant. 49pt is the standard
 * UITabBar height and Android's BottomNavigationView is close enough that one
 * value works for both.
 */
const TAB_BAR_HEIGHT = 49
const EDGE_GAP = 16

export type FabAction = {
	key: string
	icon: ReactNode
	accessibilityLabel: string
	onPress: () => void
	/** Secondary actions render as a smaller white circle, mirroring the web. */
	variant?: 'primary' | 'secondary'
	disabled?: boolean
}

export type FabProps = {
	actions: FabAction[]
}

/**
 * Floating action cluster pinned bottom-right, above the tab bar.
 *
 * Mirrors the web's `VoiceCreateFab` sitting to the left of the `+` button in
 * the mobile bottom nav.
 */
export function Fab({ actions }: FabProps) {
	const insets = useSafeAreaInsets()

	return (
		<View
			// Not `pointerEvents="none"` on the row itself — only the gaps between
			// buttons should pass touches through, which `box-none` handles.
			pointerEvents="box-none"
			style={{
				position: 'absolute',
				right: EDGE_GAP,
				bottom: insets.bottom + TAB_BAR_HEIGHT + EDGE_GAP,
			}}
			className="flex-row items-center gap-3"
		>
			{actions.map((action) => {
				const isPrimary = (action.variant ?? 'primary') === 'primary'

				return (
					<Pressable
						key={action.key}
						accessibilityRole="button"
						accessibilityLabel={action.accessibilityLabel}
						accessibilityState={{ disabled: action.disabled === true }}
						disabled={action.disabled}
						onPress={action.onPress}
						style={{
							borderCurve: 'continuous',
							boxShadow: '0 4px 14px rgba(0, 117, 135, 0.25)',
						}}
						className={[
							'items-center justify-center rounded-full',
							isPrimary ? 'h-14 w-14 bg-primary' : 'h-12 w-12 border-2 border-primary/35 bg-background',
							action.disabled === true ? 'opacity-50' : '',
						].join(' ')}
					>
						{action.icon}
					</Pressable>
				)
			})}
		</View>
	)
}
