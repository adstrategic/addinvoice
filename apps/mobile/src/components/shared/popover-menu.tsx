import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Modal, Pressable, useWindowDimensions, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { Text } from '@/components/ui'

/** Window-relative rect of the control the menu belongs to. */
export type PopoverAnchor = {
	x: number
	y: number
	width: number
	height: number
}

export type PopoverMenuItem = {
	key: string
	label: string
	icon: ReactNode
	onSelect: () => void
	/** Renders the row in destructive red, below a separator. */
	destructive?: boolean
}

export type PopoverMenuProps = {
	anchor: PopoverAnchor | null
	items: PopoverMenuItem[]
	onClose: () => void
}

const MENU_WIDTH = 200
const ROW_HEIGHT = 44
const CARD_PADDING = 6
const SEPARATOR_HEIGHT = 9
const GAP = 6
/** Keeps the card off the physical screen edges. */
const SCREEN_MARGIN = 12
const DURATION = 120

/**
 * Anchored dropdown menu, matching the web's Radix `DropdownMenu` on list rows.
 *
 * ## Why this is not a native menu
 *
 * This deliberately departs from `ui-menus`, which prefers zeego/native menus.
 * Native menus are drawn by the OS, so their background, corner radius and
 * shadow cannot be styled — and matching the web card exactly was the
 * requirement here. The cost is that accessibility has to be wired by hand
 * (`menu` / `menuitem` roles below) rather than coming from UIMenu and
 * PopupMenu, so keep those roles intact.
 *
 * ## Positioning
 *
 * The caller measures the trigger at press time and passes its window rect. The
 * card's right edge aligns to the trigger's right edge and it opens downward,
 * flipping above the trigger when there is not enough room below — which is the
 * common case for rows near the tab bar.
 *
 * The anchor is a snapshot, so it goes stale if the list scrolls underneath it.
 * The caller is responsible for closing the menu on scroll.
 */
export function PopoverMenu({ anchor, items, onClose }: PopoverMenuProps) {
	if (!anchor) return null

	// Remounted per open (via the key below), so the entry animation replays and
	// the layout maths run against a fresh anchor.
	return (
		<Modal transparent visible animationType="none" onRequestClose={onClose}>
			<PopoverMenuCard
				key={`${anchor.x}-${anchor.y}`}
				anchor={anchor}
				items={items}
				onClose={onClose}
			/>
		</Modal>
	)
}

function PopoverMenuCard({
	anchor,
	items,
	onClose,
}: {
	anchor: PopoverAnchor
	items: PopoverMenuItem[]
	onClose: () => void
}) {
	const { width: screenWidth, height: screenHeight } = useWindowDimensions()
	const insets = useSafeAreaInsets()
	const progress = useSharedValue(0)

	useEffect(() => {
		// react-compiler-reanimated-shared-values: .set()/.get(), never .value.
		progress.set(withTiming(1, { duration: DURATION }))
	}, [progress])

	const separatorCount = items.filter((item) => item.destructive === true).length
	const cardHeight =
		items.length * ROW_HEIGHT + separatorCount * SEPARATOR_HEIGHT + CARD_PADDING * 2

	// Right edges align, as on the web; clamped so the card never leaves the screen.
	const rawLeft = anchor.x + anchor.width - MENU_WIDTH
	const left = Math.min(
		Math.max(rawLeft, SCREEN_MARGIN),
		screenWidth - MENU_WIDTH - SCREEN_MARGIN,
	)

	const spaceBelow = screenHeight - insets.bottom - (anchor.y + anchor.height)
	// Flip above the trigger when the row sits too close to the bottom — without
	// this, rows near the tab bar would open a card that runs off-screen.
	const shouldFlip = spaceBelow < cardHeight + GAP
	const top = shouldFlip ? anchor.y - cardHeight - GAP : anchor.y + anchor.height + GAP
	const clampedTop = Math.max(top, insets.top + SCREEN_MARGIN)

	const cardStyle = useAnimatedStyle(() => ({
		opacity: progress.get(),
		// animation-gpu-properties: transform and opacity only, so the whole
		// animation stays on the UI thread.
		transform: [{ scale: 0.92 + progress.get() * 0.08 }],
	}))

	return (
		<>
			{/* Transparent catcher: a tap anywhere outside the card dismisses it. */}
			<Pressable
				accessibilityRole="button"
				accessibilityLabel="Close menu"
				onPress={onClose}
				style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
			/>

			<Animated.View
				accessibilityViewIsModal
				accessibilityRole="menu"
				style={[
					{
						position: 'absolute',
						top: clampedTop,
						left,
						width: MENU_WIDTH,
						paddingVertical: CARD_PADDING,
						borderCurve: 'continuous',
						// Grows out of the corner nearest the trigger, so the card reads
						// as coming from the button rather than appearing over it.
						transformOrigin: shouldFlip ? 'bottom right' : 'top right',
						// Deliberately soft — the native popup's heavy elevation was the
						// thing that looked out of place against these flat cards.
						boxShadow: '0 6px 16px rgba(2, 11, 15, 0.12)',
					},
					cardStyle,
				]}
				className="rounded-xl border border-border bg-popover"
			>
				{items.map((item) => (
					<PopoverMenuRow key={item.key} item={item} onClose={onClose} />
				))}
			</Animated.View>
		</>
	)
}

function PopoverMenuRow({ item, onClose }: { item: PopoverMenuItem; onClose: () => void }) {
	const isDestructive = item.destructive === true

	function handlePress() {
		onClose()
		// Deferred a frame rather than run inline. Both "Delete" (which presents
		// the confirmation sheet) and the navigating items would otherwise mount a
		// second Modal, or push a route, in the same commit that unmounts this
		// one — and iOS silently drops a present that lands while another modal is
		// still dismissing. One frame is enough for the teardown to finish.
		requestAnimationFrame(() => item.onSelect())
	}

	return (
		<>
			{isDestructive ? <View className="my-1 h-px bg-border" /> : null}

			<Pressable
				accessibilityRole="menuitem"
				accessibilityLabel={item.label}
				onPress={handlePress}
				style={{ height: ROW_HEIGHT }}
				className="flex-row items-center gap-3 px-3 active:bg-muted"
			>
				{item.icon}
				<Text
					className={`font-sans-medium text-base ${
						isDestructive ? 'text-destructive' : 'text-foreground'
					}`}
					numberOfLines={1}
				>
					{item.label}
				</Text>
			</Pressable>
		</>
	)
}
