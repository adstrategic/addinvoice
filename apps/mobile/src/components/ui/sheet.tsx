import { Modal, View } from 'react-native'

import { Text } from './text'

export type SheetProps = {
	isVisible: boolean
	onClose: () => void
	title?: string
	children: React.ReactNode
}

/**
 * ui-native-modals: RN's native modal in formSheet presentation, not a JS
 * bottom-sheet library — swipe-to-dismiss, keyboard avoidance and
 * accessibility come for free.
 */
export function Sheet({ isVisible, onClose, title, children }: SheetProps) {
	return (
		<Modal
			visible={isVisible}
			animationType="slide"
			presentationStyle="formSheet"
			onRequestClose={onClose}
		>
			<View className="flex-1 gap-4 bg-background p-6">
				{title ? <Text variant="title">{title}</Text> : null}
				{children}
			</View>
		</Modal>
	)
}
