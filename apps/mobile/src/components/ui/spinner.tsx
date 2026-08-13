import { ActivityIndicator, View } from 'react-native'

import { Text } from './text'

export type SpinnerProps = {
	fullScreen?: boolean
	label?: string
}

export function Spinner({ fullScreen = false, label }: SpinnerProps) {
	if (!fullScreen) {
		return <ActivityIndicator color="#00a3ab" />
	}

	return (
		<View className="flex-1 items-center justify-center gap-3 bg-background">
			<ActivityIndicator size="large" color="#00a3ab" />
			{label ? <Text variant="muted">{label}</Text> : null}
		</View>
	)
}
