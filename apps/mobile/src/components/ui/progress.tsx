import { useEffect } from 'react'
import { View } from 'react-native'
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withTiming,
} from 'react-native-reanimated'

import { cn } from '@/lib/utils'

export type ProgressBarProps = {
	/** 0–100. Values outside the range are clamped. */
	value: number
	/** Track colour class. Defaults suit a light background. */
	trackClassName?: string
	/** Fill colour class. */
	fillClassName?: string
	className?: string
}

/**
 * Mirrors the web `Progress` primitive used by the onboarding header.
 *
 * The width is driven by a shared value rather than component state so the
 * animation runs on the UI thread and never re-renders the question list
 * underneath it.
 */
export function ProgressBar({
	value,
	trackClassName = 'bg-muted',
	fillClassName = 'bg-primary',
	className,
}: ProgressBarProps) {
	const progress = useSharedValue(0)
	const clamped = Math.min(Math.max(value, 0), 100)

	useEffect(() => {
		progress.value = withTiming(clamped, { duration: 300 })
	}, [clamped, progress])

	const fillStyle = useAnimatedStyle(() => ({
		width: `${progress.value}%`,
	}))

	return (
		<View
			accessibilityRole="progressbar"
			accessibilityValue={{ min: 0, max: 100, now: Math.round(clamped) }}
			style={{ borderCurve: 'continuous' }}
			className={cn('h-2 w-full overflow-hidden rounded-full', trackClassName, className)}
		>
			<Animated.View style={fillStyle} className={cn('h-full rounded-full', fillClassName)} />
		</View>
	)
}
