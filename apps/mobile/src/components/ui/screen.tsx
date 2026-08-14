import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

import { cn } from '@/lib/utils'

export type ScreenProps = {
	children: ReactNode
	/** Set for form screens so the keyboard doesn't cover the focused field. */
	avoidKeyboard?: boolean
	/** Centres content vertically — for splash, error and empty states. */
	center?: boolean
	/**
	 * Opts out of the top safe-area inset, for screens that deliberately draw
	 * under the status bar (a full-bleed hero image, say).
	 */
	ignoreTopInset?: boolean
	className?: string
	contentClassName?: string
}

/**
 * Root scroll container for every screen.
 *
 * ## Safe areas
 *
 * Insets are applied manually from `useSafeAreaInsets`, with
 * `contentInsetAdjustmentBehavior="never"` so the native path cannot also apply
 * them and double the padding.
 *
 * This deliberately departs from the `ui-safe-area-scroll` guidance of relying
 * on `contentInsetAdjustmentBehavior="automatic"`: that prop is **iOS-only**.
 * Android has been edge-to-edge since SDK 57 — `AppTheme` sets both
 * `android:statusBarColor` and `android:navigationBarColor` to transparent — so
 * on Android the automatic path is a no-op and content renders underneath the
 * status bar and the camera cutout. Doing the inset by hand is also the only
 * way to guarantee both platforms lay out identically, which matters because
 * these screens are built to match a shared design.
 *
 * Note the inset is padding on the scroll *content*, not on the ScrollView, so
 * a coloured background still extends behind the status bar while the content
 * itself starts below it.
 *
 * An opaque band is then painted over that inset, matching the screen
 * background, so scrolled content does not appear behind the clock and battery.
 * `ignoreTopInset` removes both the padding and the band together.
 */
export function Screen({
	children,
	avoidKeyboard = false,
	center = false,
	ignoreTopInset = false,
	className,
	contentClassName,
}: ScreenProps) {
	const insets = useSafeAreaInsets()

	const scroll = (
		<ScrollView
			// Manual insets below; letting the native path also adjust would stack
			// the two on iOS.
			contentInsetAdjustmentBehavior="never"
			keyboardShouldPersistTaps="handled"
			className={cn('flex-1 bg-background', className)}
			// Style only — mixing contentContainerStyle with
			// contentContainerClassName risks one overwriting the other rather than
			// merging, so all class-based layout lives on the inner View.
			contentContainerStyle={{
				flexGrow: 1,
				paddingTop: ignoreTopInset ? 0 : insets.top,
				paddingBottom: insets.bottom,
			}}
		>
			{/* `grow` (flexGrow) rather than `flex-1`: flex-1 sets flexBasis to 0,
			    which squashes content taller than the viewport instead of letting
			    the scroll area expand. */}
			<View className={cn('grow gap-4 p-6', center ? 'justify-center' : '', contentClassName)}>
				{children}
			</View>
		</ScrollView>
	)

	const body = avoidKeyboard ? (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			className="flex-1"
		>
			{scroll}
		</KeyboardAvoidingView>
	) : (
		scroll
	)

	return (
		<View className={cn('flex-1 bg-background', className)}>
			{body}
			{/* Opaque band over the status-bar inset.
			    The inset alone only moves content down — the scroll area still runs
			    underneath, so scrolled content shows through behind the clock and
			    battery. Painting over it is the only reliable fix under edge-to-edge:
			    `android:statusBarColor` and expo-status-bar's `backgroundColor` are
			    both no-ops on Android 15+, which forces edge-to-edge.
			    Rendered after `body` so it paints on top; zIndex guards against
			    Android's elevation-based ordering. */}
			{ignoreTopInset ? null : (
				<View
					pointerEvents="none"
					style={{ position: 'absolute', top: 0, left: 0, right: 0, height: insets.top, zIndex: 1 }}
					className={cn('bg-background', className)}
				/>
			)}
		</View>
	)
}

/** Non-scrolling variant for screens that must fill exactly one viewport. */
export function ScreenView({
	children,
	className,
	ignoreTopInset = false,
}: {
	children: ReactNode
	className?: string
	ignoreTopInset?: boolean
}) {
	const insets = useSafeAreaInsets()

	// The inset sits on an outer wrapper so it adds to the inner `p-6` rather
	// than replacing it — an inline style would win over the class otherwise.
	return (
		<View
			style={{
				paddingTop: ignoreTopInset ? 0 : insets.top,
				paddingBottom: insets.bottom,
			}}
			className={cn('flex-1 bg-background', className)}
		>
			<View className="flex-1 p-6">{children}</View>
		</View>
	)
}
