import * as ImagePicker from 'expo-image-picker'
import { Pressable, View } from 'react-native'

import { FieldLabel, Image, Text } from '@/components/ui'
import { BuildingIcon, UploadIcon } from '@/components/ui/icons'
import type { LogoUpload } from '@/features/businesses/service/businesses.service'

const MAX_LOGO_BYTES = 5 * 1024 * 1024

export type LogoPickerFieldProps = {
	value: LogoUpload | null
	onChange: (logo: LogoUpload | null) => void
	error?: string
	onError: (message: string | null) => void
	required?: boolean
}

/**
 * Mirrors the web logo block in `CreateCompanyForm`: an 80×80 preview tile
 * beside an upload action and its helper text.
 *
 * Size and mime are validated here rather than in the zod schema — the schema
 * is shared with the web, where a logo is a `File`, and the backend cap is 5 MB.
 */
export function LogoPickerField({
	value,
	onChange,
	error,
	onError,
	required = true,
}: LogoPickerFieldProps) {
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

	function handleRemove() {
		onError(null)
		onChange(null)
	}

	return (
		<View className="gap-2">
			<FieldLabel required={required}>Company logo</FieldLabel>

			<View className="flex-row items-start gap-4">
				<View
					style={{ borderCurve: 'continuous' }}
					className="h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-primary/20"
				>
					{value ? (
						<Image
							source={{ uri: value.uri }}
							style={{ width: '100%', height: '100%' }}
							contentFit="cover"
						/>
					) : (
						<BuildingIcon size={40} color="#00a3ab" />
					)}
				</View>

				<View className="min-w-0 flex-1 gap-2">
					<View className="flex-row items-center gap-2">
						<Pressable
							accessibilityRole="button"
							onPress={handlePick}
							style={{ borderCurve: 'continuous' }}
							className="min-h-10 flex-row items-center gap-2 rounded-lg border border-border bg-background px-4 py-2"
						>
							<UploadIcon size={16} color="#020b0f" />
							<Text className="font-sans-medium text-sm text-foreground">
								{value ? 'Change logo' : 'Upload logo'}
							</Text>
						</Pressable>

						{value ? (
							<Pressable
								accessibilityRole="button"
								onPress={handleRemove}
								className="min-h-10 justify-center px-2 py-2"
							>
								<Text className="font-sans-medium text-sm text-destructive">Remove</Text>
							</Pressable>
						) : null}
					</View>

					<Text className="font-sans text-xs text-muted-foreground">
						Recommended: square image, max 5MB (JPG, PNG, WebP, SVG)
					</Text>

					{error ? <Text variant="error">{error}</Text> : null}
				</View>
			</View>
		</View>
	)
}
