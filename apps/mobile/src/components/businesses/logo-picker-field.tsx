import * as ImagePicker from 'expo-image-picker'
import { Pressable, View } from 'react-native'

import { Image, Text } from '@/components/ui'
import type { LogoUpload } from '@/features/businesses/service/businesses.service'

const MAX_LOGO_BYTES = 5 * 1024 * 1024

export type LogoPickerFieldProps = {
	value: LogoUpload | null
	onChange: (logo: LogoUpload | null) => void
	error?: string
	onError: (message: string | null) => void
}

/**
 * Size and mime are validated here rather than in the zod schema: the schema is
 * shared with the web, where a logo is a `File`, and the backend cap is 5 MB.
 */
export function LogoPickerField({ value, onChange, error, onError }: LogoPickerFieldProps) {
	async function handlePick() {
		onError(null)

		const permission = await ImagePicker.requestMediaLibraryPermissionsAsync()
		if (!permission.granted) {
			onError('Photo access is needed to choose a logo. You can enable it in Settings.')
			return
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ['images'],
			quality: 0.8,
			allowsEditing: true,
		})

		if (result.canceled) return

		const asset = result.assets[0]
		if (!asset) return

		if (asset.fileSize != null && asset.fileSize > MAX_LOGO_BYTES) {
			onError('That image is larger than 5 MB. Please choose a smaller one.')
			return
		}

		const mimeType = asset.mimeType ?? 'image/jpeg'
		if (!mimeType.startsWith('image/')) {
			onError('Please choose an image file.')
			return
		}

		onChange({
			uri: asset.uri,
			name: asset.fileName ?? `logo.${mimeType.split('/')[1] ?? 'jpg'}`,
			type: mimeType,
		})
	}

	return (
		<View className="gap-1.5">
			<Text variant="label">Business logo</Text>
			<Pressable
				accessibilityRole="button"
				onPress={handlePick}
				style={{ borderCurve: 'continuous' }}
				className="min-h-24 flex-row items-center gap-4 rounded-lg border border-dashed border-input bg-card p-4"
			>
				{value ? (
					<Image
						source={{ uri: value.uri }}
						style={{ width: 64, height: 64, borderRadius: 8 }}
						contentFit="contain"
					/>
				) : null}
				<Text variant="muted" className="flex-1">
					{value ? 'Tap to choose a different image' : 'Tap to choose an image (max 5 MB)'}
				</Text>
			</Pressable>
			{error ? <Text variant="error">{error}</Text> : null}
		</View>
	)
}
