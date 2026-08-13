import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native'

import { cn } from '@/lib/utils'

export type ScreenProps = {
	children: ReactNode
	/** Set for form screens so the keyboard doesn't cover the focused field. */
	avoidKeyboard?: boolean
	/** Centres content vertically — for splash, error and empty states. */
	center?: boolean
	className?: string
	contentClassName?: string
}

/**
 * Root scroll container for every screen.
 *
 * ui-safe-area-scroll: safe areas come from `contentInsetAdjustmentBehavior`,
 * never from a SafeAreaView wrapper or manual `insets.top` padding — the native
 * path also handles dynamic insets like the keyboard.
 */
export function Screen({
	children,
	avoidKeyboard = false,
	center = false,
	className,
	contentClassName,
}: ScreenProps) {
	const scroll = (
		<ScrollView
			contentInsetAdjustmentBehavior="automatic"
			keyboardShouldPersistTaps="handled"
			className={cn('flex-1 bg-background', className)}
			contentContainerClassName={cn(
				'gap-4 p-6',
				center ? 'flex-grow justify-center' : '',
				contentClassName,
			)}
		>
			{children}
		</ScrollView>
	)

	if (!avoidKeyboard) {
		return scroll
	}

	return (
		<KeyboardAvoidingView
			behavior={Platform.OS === 'ios' ? 'padding' : undefined}
			className="flex-1"
		>
			{scroll}
		</KeyboardAvoidingView>
	)
}

/** Non-scrolling variant for screens that must fill exactly one viewport. */
export function ScreenView({ children, className }: { children: ReactNode; className?: string }) {
	return <View className={cn('flex-1 bg-background p-6', className)}>{children}</View>
}
