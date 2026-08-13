import { zodResolver } from '@hookform/resolvers/zod'
import { createBusinessSchema, type CreateBusinessDTO } from '@addinvoice/schemas'
import { router } from 'expo-router'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'

import { LogoPickerField } from '@/components/businesses/logo-picker-field'
import { FunnelGuard } from '@/components/guards/funnel-guard'
import { Button, Input, Screen, Select, Text, View } from '@/components/ui'
import {
	useCreateBusiness,
	useSetDefaultBusiness,
	useUploadBusinessLogo,
} from '@/features/businesses/hooks/use-businesses'
import type { LogoUpload } from '@/features/businesses/service/businesses.service'
import { SETUP_DEFAULT_NOTES, SETUP_DEFAULT_TERMS } from '@/features/businesses/setup-defaults'
import { TaxMode } from '@/features/businesses/tax-mode'

const TAX_MODE_OPTIONS = [
	{ value: TaxMode.NONE, label: 'No tax' },
	{ value: TaxMode.BY_PRODUCT, label: 'Tax per line item' },
	{ value: TaxMode.BY_TOTAL, label: 'Tax on the total' },
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
			defaultTaxName: '',
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
			setLogoError('A logo is required to finish setup.')
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

	return (
		<FunnelGuard requiredStep="setup">
			<Screen avoidKeyboard>
				<View className="gap-2">
					<Text variant="heading">Set up your business</Text>
					<Text variant="muted">
						This appears on every invoice and estimate you send.
					</Text>
				</View>

				<Controller
					control={control}
					name="name"
					render={({ field }) => (
						<Input
							label="Business name"
							value={field.value ?? ''}
							onChangeText={field.onChange}
							onBlur={field.onBlur}
							error={errors.name?.message}
							placeholder="Acme Construction"
						/>
					)}
				/>

				<Controller
					control={control}
					name="email"
					render={({ field }) => (
						<Input
							label="Business email"
							value={field.value ?? ''}
							onChangeText={field.onChange}
							onBlur={field.onBlur}
							error={errors.email?.message}
							autoCapitalize="none"
							keyboardType="email-address"
							placeholder="billing@acme.com"
						/>
					)}
				/>

				<Controller
					control={control}
					name="phone"
					render={({ field }) => (
						<Input
							label="Phone"
							value={field.value ?? ''}
							onChangeText={field.onChange}
							onBlur={field.onBlur}
							error={errors.phone?.message}
							keyboardType="phone-pad"
							// The schema requires E.164, so the country code is not optional.
							placeholder="+15551234567"
						/>
					)}
				/>

				<Controller
					control={control}
					name="address"
					render={({ field }) => (
						<Input
							label="Address"
							value={field.value ?? ''}
							onChangeText={field.onChange}
							onBlur={field.onBlur}
							error={errors.address?.message}
							placeholder="123 Main St, Springfield"
							multiline
						/>
					)}
				/>

				<Controller
					control={control}
					name="nit"
					render={({ field }) => (
						<Input
							label="Tax ID (optional)"
							value={field.value ?? ''}
							onChangeText={field.onChange}
							onBlur={field.onBlur}
							error={errors.nit?.message}
							placeholder="123456789"
						/>
					)}
				/>

				<Controller
					control={control}
					name="defaultTaxMode"
					render={({ field }) => (
						<Select
							label="Default tax handling"
							value={field.value ?? TaxMode.NONE}
							options={TAX_MODE_OPTIONS}
							onChange={field.onChange}
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
									label="Tax name"
									value={field.value ?? ''}
									onChangeText={field.onChange}
									onBlur={field.onBlur}
									error={errors.defaultTaxName?.message}
									placeholder="VAT"
								/>
							)}
						/>
						<Controller
							control={control}
							name="defaultTaxPercentage"
							render={({ field }) => (
								<Input
									label="Tax percentage"
									value={field.value == null ? '' : String(field.value)}
									onChangeText={(text) =>
										field.onChange(text === '' ? null : Number(text))
									}
									onBlur={field.onBlur}
									error={errors.defaultTaxPercentage?.message}
									keyboardType="decimal-pad"
									placeholder="19"
								/>
							)}
						/>
					</>
				) : null}

				<LogoPickerField
					value={logo}
					onChange={setLogo}
					error={logoError ?? undefined}
					onError={setLogoError}
				/>

				{formError ? <Text variant="error">{formError}</Text> : null}

				<Button
					label={createdBusinessId == null ? 'Finish setup' : 'Retry logo upload'}
					isLoading={isSubmitting}
					onPress={() => void handleSubmit(onSubmit)()}
				/>
			</Screen>
		</FunnelGuard>
	)
}
