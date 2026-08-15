import { zodResolver } from '@hookform/resolvers/zod'
import {
	createBusinessSchema,
	updateBusinessSchema,
	type CreateBusinessDTO,
} from '@addinvoice/schemas'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, View } from 'react-native'

import { LogoPickerField } from '@/components/shared/logo-picker-field'
import { RichTextEditor } from '@/components/rich-text/rich-text-editor'
import { Divider, FieldLabel, Input, NumericInput, Select, Text } from '@/components/ui'
import { ArrowRightIcon } from '@/components/ui/icons'
import type { LogoUpload } from '@/features/businesses/service/businesses.service'
import { TaxMode } from '@/features/businesses/tax-mode'

/** Labels match the web select verbatim so both clients read the same. */
const TAX_MODE_OPTIONS = [
	{ value: TaxMode.NONE, label: 'None' },
	{ value: TaxMode.BY_PRODUCT, label: 'By product' },
	{ value: TaxMode.BY_TOTAL, label: 'By total' },
]

/**
 * What the caller should do about the logo after saving the fields.
 *
 * Modelled explicitly rather than as a nullable file, because "no new file" and
 * "delete the saved one" are different intentions that hit different endpoints.
 */
export type LogoAction =
	| { type: 'keep' }
	| { type: 'upload'; file: LogoUpload }
	| { type: 'remove' }

export type CompanyFormProps = {
	/** Selects the zod schema — update allows partials, create does not. */
	mode: 'create' | 'edit'
	defaultValues?: Partial<CreateBusinessDTO>
	/** Setup and the create screen both demand a logo; editing does not. */
	logoRequired?: boolean
	/** The logo already on the record, for edit mode. */
	initialLogoUrl?: string | null
	submitLabel: string
	/** Shown while the submit is in flight; also replaces the label. */
	isSubmitting?: boolean
	submittingLabel?: string
	/** Rendered above the submit button — for a form-level error message. */
	footer?: React.ReactNode
	onSubmit: (data: CreateBusinessDTO, logo: LogoAction) => void | Promise<void>
}

/**
 * The business form shared by setup, create and edit — the mobile counterpart
 * of the web's `CreateCompanyForm`.
 *
 * Both rich-text editors are mounted inline, matching the web layout. That is
 * two WebViews on this screen, which is why a list of businesses must never
 * render this component per row.
 */
export function CompanyForm({
	mode,
	defaultValues,
	logoRequired = true,
	initialLogoUrl = null,
	submitLabel,
	isSubmitting = false,
	submittingLabel = 'Saving...',
	footer,
	onSubmit,
}: CompanyFormProps) {
	const [logo, setLogo] = useState<LogoUpload | null>(null)
	const [isExistingLogoRemoved, setIsExistingLogoRemoved] = useState(false)
	const [logoError, setLogoError] = useState<string | null>(null)

	const {
		control,
		handleSubmit,
		watch,
		setValue,
		formState: { errors },
	} = useForm<CreateBusinessDTO>({
		resolver: zodResolver(mode === 'edit' ? updateBusinessSchema : createBusinessSchema),
		defaultValues: {
			name: '',
			email: '',
			nit: '',
			address: '',
			phone: '',
			defaultTaxMode: TaxMode.NONE,
			defaultTaxName: null,
			defaultTaxPercentage: null,
			defaultNotes: null,
			defaultTerms: null,
			...defaultValues,
		},
	})

	const taxMode = watch('defaultTaxMode')
	const isByTotal = taxMode === TaxMode.BY_TOTAL
	const visibleLogoUrl = isExistingLogoRemoved ? null : initialLogoUrl
	const hasAnyLogo = logo != null || visibleLogoUrl != null

	function handleRemoveLogo() {
		// Drop the pending pick first; only then fall through to the saved logo.
		if (logo) {
			setLogo(null)
			return
		}
		setIsExistingLogoRemoved(true)
	}

	function buildLogoAction(): LogoAction {
		if (logo) return { type: 'upload', file: logo }
		if (isExistingLogoRemoved && initialLogoUrl) return { type: 'remove' }
		return { type: 'keep' }
	}

	function submit(values: CreateBusinessDTO) {
		setLogoError(null)

		if (logoRequired && !hasAnyLogo) {
			setLogoError('Logo is required')
			return
		}

		// Tax name and percentage only mean something when tax applies to the
		// total; sending them otherwise stores a rate the app will never use.
		const payload: CreateBusinessDTO = {
			...values,
			defaultTaxMode: values.defaultTaxMode ?? TaxMode.NONE,
			defaultTaxName: isByTotal ? values.defaultTaxName : null,
			defaultTaxPercentage: isByTotal ? values.defaultTaxPercentage : null,
			defaultNotes: values.defaultNotes ?? null,
			defaultTerms: values.defaultTerms ?? null,
		}

		void onSubmit(payload, buildLogoAction())
	}

	return (
		<>
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
				existingUrl={visibleLogoUrl}
				onRemove={handleRemoveLogo}
				required={logoRequired}
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
								// Clearing on mode change stops a stale rate being
								// submitted with a mode that ignores it.
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

			{footer}

			<Divider />

			<View className="flex-row justify-end">
				<Pressable
					accessibilityRole="button"
					accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
					disabled={isSubmitting}
					onPress={() => void handleSubmit(submit)()}
					style={{ borderCurve: 'continuous' }}
					className={`min-h-12 flex-row items-center justify-center gap-2 rounded-lg bg-primary px-5 py-3 ${
						isSubmitting ? 'opacity-50' : ''
					}`}
				>
					<Text className="font-sans-semibold text-base text-primary-foreground">
						{isSubmitting ? submittingLabel : submitLabel}
					</Text>
					<ArrowRightIcon size={16} color="#ffffff" />
				</Pressable>
			</View>
		</>
	)
}

/**
 * The rich-text fields are object-shaped, so react-hook-form types their error
 * as a nested `FieldErrorsImpl` whose `message` is not necessarily a string.
 */
function fieldMessage(error?: { message?: unknown }): string | undefined {
	return typeof error?.message === 'string' ? error.message : undefined
}
