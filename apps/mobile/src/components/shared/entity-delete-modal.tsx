import { Pressable, View } from 'react-native'

import { Button, Sheet, Text } from '@/components/ui'
import { AlertTriangleIcon } from '@/components/ui/icons'

export type EntityDeleteModalProps = {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	/** Lower-case singular, e.g. "client" — used in both the title and the body. */
	entity: string
	entityName: string
	isDeleting: boolean
}

/**
 * Port of the web `components/shared/EntityDeleteModal.tsx`, wording included.
 *
 * ui-native-modals: built on the `Sheet` primitive (RN's native modal in
 * formSheet presentation), so swipe-to-dismiss and keyboard avoidance come from
 * the platform.
 */
export function EntityDeleteModal({
	isOpen,
	onClose,
	onConfirm,
	entity,
	entityName,
	isDeleting,
}: EntityDeleteModalProps) {
	return (
		<Sheet isVisible={isOpen} onClose={onClose}>
			<View className="flex-row items-center gap-2">
				<AlertTriangleIcon size={20} color="#d40924" />
				<Text variant="title">Delete {entity}</Text>
			</View>

			<Text variant="muted">
				Are you sure you want to delete the {entity} &quot;{entityName}&quot;? This action cannot be
				undone.
			</Text>

			<View className="gap-2">
				<Pressable
					accessibilityRole="button"
					accessibilityState={{ disabled: isDeleting, busy: isDeleting }}
					disabled={isDeleting}
					onPress={onConfirm}
					// ui-styling: borderCurve pairs with every borderRadius.
					style={{ borderCurve: 'continuous' }}
					className={`min-h-12 items-center justify-center rounded-lg bg-destructive px-5 py-3 ${
						isDeleting ? 'opacity-50' : ''
					}`}
				>
					<Text className="font-sans-semibold text-base text-destructive-foreground">
						{isDeleting ? 'Deleting...' : 'Delete'}
					</Text>
				</Pressable>

				<Button label="Cancel" variant="outline" disabled={isDeleting} onPress={onClose} />
			</View>
		</Sheet>
	)
}
