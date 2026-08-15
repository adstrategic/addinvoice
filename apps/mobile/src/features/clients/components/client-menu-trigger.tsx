import { memo, useRef } from 'react'
import { Pressable, View } from 'react-native'

import type { PopoverAnchor } from '@/components/shared/popover-menu'
import { MoreVerticalIcon } from '@/components/ui/icons'

export type ClientMenuTriggerProps = {
	sequence: number
	onOpenMenu: (sequence: number, anchor: PopoverAnchor) => void
}

/**
 * The ⋮ button on a client row.
 *
 * Measures itself at press time and hands the window rect up, so the screen can
 * open one shared `PopoverMenu` anchored to this specific row rather than every
 * row mounting a menu of its own (list-performance-item-expensive).
 */
export const ClientMenuTrigger = memo(function ClientMenuTrigger({
	sequence,
	onOpenMenu,
}: ClientMenuTriggerProps) {
	const ref = useRef<View>(null)

	function handlePress() {
		// ui-measure-views: getBoundingClientRect is the synchronous RN 0.82+ API
		// and, like its DOM namesake, reports window-relative coordinates — which
		// is exactly what the popover needs. Measured on press rather than on
		// layout because the row moves as the list scrolls.
		const rect = ref.current?.getBoundingClientRect()
		if (!rect) return

		onOpenMenu(sequence, {
			x: rect.x,
			y: rect.y,
			width: rect.width,
			height: rect.height,
		})
	}

	return (
		<Pressable
			ref={ref}
			accessibilityRole="button"
			accessibilityLabel="Client actions"
			accessibilityHint="Opens actions for this client"
			onPress={handlePress}
			// Padded out to a comfortable touch target; the glyph itself is small.
			className="h-9 w-9 shrink-0 items-center justify-center"
		>
			<MoreVerticalIcon size={18} color="#58666a" />
		</Pressable>
	)
})
