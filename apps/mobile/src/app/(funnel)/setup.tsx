import { zodResolver } from '@hookform/resolvers/zod'
import { createBusinessSchema, type CreateBusinessDTO } from '@addinvoice/schemas'
import { router } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, View } from 'react-native'

import { LogoPickerField } from '@/components/businesses/logo-picker-field'
import { FunnelGuard } from '@/components/guards/funnel-guard'
import { RichTextEditor } from '@/components/rich-text/rich-text-editor'
import {
	Card,
	Divider,
	FieldLabel,
	Input,
	NumericInput,
	Screen,
	Select,
	Text,
} from '@/components/ui'
import { ArrowRightIcon, BuildingIcon } from '@/components/ui/icons'
import {
	useCreateBusiness,
	useSetDefaultBusiness,
	useUploadBusinessLogo,
} from '@/features/businesses/hooks/use-businesses'
import type { LogoUpload } from '@/features/businesses/service/businesses.service'
import { SETUP_DEFAULT_NOTES, SETUP_DEFAULT_TERMS } from '@/features/businesses/setup-defaults'
import { TaxMode } from '@/features/businesses/tax-mode'

/**
 * The rich-text fields are object-shaped, so react-hook-form types their error
 * as a nested `FieldErrorsImpl` whose `message` is not necessarily a string.
 * Narrow it rather than casting.
 */
function fieldMessage(error?: { message?: unknown }): string | undefined {
	return typeof error?.message === 'string' ? error.message : undefined
}

/** Labels match the web select verbatim so both clients read the same. */
const TAX_MODE_OPTIONS = [
	{ value: TaxMode.NONE, label: 'None' },
	{ value: TaxMode.BY_PRODUCT, label: 'By product' },
	{ value: TaxMode.BY_TOTAL, label: 'By total' },
]

export default function SetupScreen() {
	const createBusiness = useCreateBusiness()
	const setDefaultBusiness = useSetDefaultBusiness()
	const uploadLogo = useUploadBusinessLogo()

	const [logo, setLogo] = useState<LogoUpload | null>(null)
	const [logoError, setLogoError] = useState<string | null>(null)
	const [formError, setFormError] = useState<string | null>(null)
	// Set once the business exists, so a failed logo upload retries only the upload.
	const [createdBusinessId, setCreatedBusinessId] = useState<number | null>(null)

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors, isSubmitting },
	} = useForm<CreateBusinessDTO>({
		resolver: zodResolver(createBusinessSchema),
		defaultValues: {
			name: '',
			email: '',
			nit: '',
			address: '',
			phone: '',
			defaultTaxMode: TaxMode.NONE,
			defaultTaxName: null,
			defaultTaxPercentage: null,
			defaultNotes: SETUP_DEFAULT_NOTES,
			defaultTerms: SETUP_DEFAULT_TERMS,
		},
	})

	const taxMode = watch('defaultTaxMode')
	const isByTotal = taxMode === TaxMode.BY_TOTAL

	async function onSubmit(values: CreateBusinessDTO) {
		setFormError(null)
		setLogoError(null)

		if (!logo) {
			setLogoError('Logo is required')
			return
		}

		try {
			let businessId = createdBusinessId

			if (businessId == null) {
				// Tax name/percentage only mean something when tax applies to the total.
				const payload: CreateBusinessDTO = {
					...values,
					defaultTaxName: isByTotal ? values.defaultTaxName : null,
					defaultTaxPercentage: isByTotal ? values.defaultTaxPercentage : null,
				}

				const business = await createBusiness.mutateAsync(payload)
				businessId = business.id
				setCreatedBusinessId(business.id)
				await setDefaultBusiness.mutateAsync(business.id)
			}

			await uploadLogo.mutateAsync({ id: businessId, file: logo })
			router.replace('/(main)/clients')
		} catch {
			// handleMutationError already toasted the specific reason.
			setFormError(
				createdBusinessId == null
					? 'We could not create your business. Please check the fields and try again.'
					: 'Your business was created but the logo did not upload. Tap to retry the upload.',
			)
		}
	}

	const isBusy = isSubmitting || uploadLogo.isPending

	return (
		<FunnelGuard requiredStep="setup">
			<Screen avoidKeyboard contentClassName="gap-8">
				<View className="items-center gap-2">
					<View className="mb-2 h-16 w-16 items-center justify-center rounded-full bg-primary/20">
						<BuildingIcon size={32} color="#00a3ab" />
					</View>
					<Text className="text-center font-sans-bold text-3xl leading-tight text-foreground">
						Welcome! Let&apos;s set up your business
					</Text>
					<Text className="text-center font-sans text-base text-muted-foreground">
						We need some basic information to get you started with invoicing
					</Text>
				</View>

				<Card className="gap-6 p-6">
					<View className="gap-1.5">
						<Text variant="title">Business Information</Text>
						<Text className="font-sans text-sm text-muted-foreground">
							Enter your business details. You can update these later in settings.
						</Text>
					</View>

					<Divider />

					<View className="gap-4">
						<Controller
							control={control}
							name="name"
							render={({ field }) => (
								<Input
									label="Company Name"
									required
									value={field.value ?? ''}
									onChangeText={field.onChange}
									onBlur={field.onBlur}
									error={errors.name?.message}
									placeholder="My Company Inc."
								/>
							)}
						/>

						<Controller
							control={control}
							name="nit"
							render={({ field }) => (
								<Input
									label="NIT / Tax ID (optional)"
									value={field.value ?? ''}
									onChangeText={field.onChange}
									onBlur={field.onBlur}
									error={errors.nit?.message}
									placeholder="123456789-0"
								/>
							)}
						/>

						<Controller
							control={control}
							name="address"
							render={({ field }) => (
								<Input
									label="Address"
									required
									value={field.value ?? ''}
									onChangeText={field.onChange}
									onBlur={field.onBlur}
									error={errors.address?.message}
									placeholder="123 Business St, City, Country"
									rows={2}
								/>
							)}
						/>

						<Controller
							control={control}
							name="email"
							render={({ field }) => (
								<Input
									label="Email"
									required
									value={field.value ?? ''}
									onChangeText={field.onChange}
									onBlur={field.onBlur}
									error={errors.email?.message}
									autoCapitalize="none"
									autoComplete="email"
									keyboardType="email-address"
									placeholder="contact@company.com"
								/>
							)}
						/>

						<Controller
							control={control}
							name="phone"
							render={({ field }) => (
								<Input
									label="Phone"
									required
									value={field.value ?? ''}
									onChangeText={field.onChange}
									onBlur={field.onBlur}
									error={errors.phone?.message}
									keyboardType="phone-pad"
									// The schema requires E.164, so the country code is not optional.
									placeholder="+1 (555) 123-4567"
								/>
							)}
						/>
					</View>

					<Divider />

					<LogoPickerField
						value={logo}
						onChange={setLogo}
						error={logoError ?? undefined}
						onError={setLogoError}
					/>

					<Divider />

					<View className="gap-4">
						<Text className="font-sans-medium text-base text-foreground">
							Invoice defaults (optional)
						</Text>

						<Controller
							control={control}
							name="defaultTaxMode"
							render={({ field }) => (
								<Select
									label="VAT / Tax"
									labelMuted
									variant="dropdown"
									placeholder="Select tax mode"
									value={field.value ?? TaxMode.NONE}
									options={TAX_MODE_OPTIONS}
									onChange={(value) => {
										field.onChange(value)
										// Mirrors the web: clearing these on mode change stops a stale
										// rate being submitted with a mode that ignores it.
										if (value !== TaxMode.BY_TOTAL) {
											setValue('defaultTaxName', null)
											setValue('defaultTaxPercentage', null)
										}
									}}
									error={errors.defaultTaxMode?.message}
								/>
							)}
						/>

						{isByTotal ? (
							<>
								<Controller
									control={control}
									name="defaultTaxName"
									render={({ field }) => (
										<Input
											label="Tax name (optional)"
											labelMuted
											value={field.value ?? ''}
											onChangeText={field.onChange}
											onBlur={field.onBlur}
											error={errors.defaultTaxName?.message}
											placeholder="e.g. VAT, Sales Tax"
										/>
									)}
								/>
								<Controller
									control={control}
									name="defaultTaxPercentage"
									render={({ field }) => (
										<NumericInput
											label="Tax percentage (%)"
											labelMuted
											value={field.value}
											onChangeValue={field.onChange}
											onBlur={field.onBlur}
											error={errors.defaultTaxPercentage?.message}
											placeholder="0"
										/>
									)}
								/>
							</>
						) : null}

						<View className="gap-1.5">
							<FieldLabel muted>Default notes (for invoices)</FieldLabel>
							<Controller
								control={control}
								name="defaultNotes"
								render={({ field }) => (
									<RichTextEditor
										value={field.value as Record<string, unknown> | null}
										onChange={field.onChange}
										placeholder="Optional default notes on new invoices"
										error={fieldMessage(errors.defaultNotes)}
									/>
								)}
							/>
						</View>

						<View className="gap-1.5">
							<FieldLabel muted>Default terms &amp; conditions (for invoices)</FieldLabel>
							<Controller
								control={control}
								name="defaultTerms"
								render={({ field }) => (
									<RichTextEditor
										value={field.value as Record<string, unknown> | null}
										onChange={field.onChange}
										placeholder="Optional default terms on new invoices"
										error={fieldMessage(errors.defaultTerms)}
									/>
								)}
							/>
						</View>
					</View>

					{formError ? <Text variant="error">{formError}</Text> : null}

					<Divider />

					<View className="flex-row justify-end">
						<Pressable
							accessibilityRole="button"
							accessibilityState={{ disabled: isBusy, busy: isBusy }}
							disabled={isBusy}
							onPress={() => void handleSubmit(onSubmit)()}
							style={{ borderCurve: 'continuous' }}
							className={`min-h-12 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 ${
								isBusy ? 'opacity-50' : ''
							}`}
						>
							<Text className="font-sans-semibold text-base text-primary-foreground">
								{isBusy
									? 'Setting up...'
									: createdBusinessId == null
										? 'Complete Setup'
										: 'Retry logo upload'}
							</Text>
							<ArrowRightIcon size={16} color="#ffffff" />
						</Pressable>
					</View>
				</Card>
			</Screen>
		</FunnelGuard>
	)
}
