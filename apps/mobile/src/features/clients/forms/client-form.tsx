import {
	createClientSchema,
	updateClientSchema,
	type CreateClientDTO,
	type UpdateClientDTO,
} from '@addinvoice/schemas'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { Pressable, View } from 'react-native'

import { LogoPickerField } from '@/components/shared/logo-picker-field'
import { Button, Divider, Input, NumericInput, Text } from '@/components/ui'
import { InfoIcon } from '@/components/ui/icons'
import type { LogoUpload } from '@/lib/api/types'
import { useDirtyValues } from '@/hooks/use-dirty-values'

/**
 * What the caller should do about the logo after saving the fields.
 * Same contract as `CompanyForm` — "no new file" and "delete the saved one" are
 * different intentions that hit different endpoints.
 */
export type LogoAction =
	| { type: 'keep' }
	| { type: 'upload'; file: LogoUpload }
	| { type: 'remove' }

export type ClientFormProps = {
	/** Selects the zod schema — update allows partials, create does not. */
	mode: 'create' | 'edit'
	defaultValues?: Partial<CreateClientDTO>
	/** The logo already on the record, for edit mode. */
	initialLogoUrl?: string | null
	submitLabel: string
	isSubmitting?: boolean
	submittingLabel?: string
	onCancel?: () => void
	/** Rendered above the actions — for a form-level error message. */
	footer?: React.ReactNode
	/**
	 * `values` is everything the user sees; `dirty` is only what changed.
	 *
	 * Create screens use `values`, edit screens use `dirty` — PATCH bodies are
	 * `createClientSchema.partial()`, and re-sending untouched fields risks
	 * clobbering a concurrent edit. Passing both keeps each screen's call site
	 * free of casts.
	 */
	onSubmit: (
		values: CreateClientDTO,
		dirty: UpdateClientDTO,
		logo: LogoAction,
	) => void | Promise<void>
}

/**
 * The client form shared by create and edit — the mobile counterpart of the
 * web's `ClientForm` plus its `form-fields/` directory.
 *
 * Returns a fragment: the screen supplies `Screen avoidKeyboard` and the `Card`,
 * exactly like `CompanyForm`. Section titles and helper copy are the web's,
 * verbatim, so both apps read the same.
 *
 * The web lays the fields out in a two-column grid; on a phone they stack.
 */
export function ClientForm({
	mode,
	defaultValues,
	initialLogoUrl = null,
	submitLabel,
	isSubmitting = false,
	submittingLabel = 'Saving...',
	onCancel,
	footer,
	onSubmit,
}: ClientFormProps) {
	const [logo, setLogo] = useState<LogoUpload | null>(null)
	const [isExistingLogoRemoved, setIsExistingLogoRemoved] = useState(false)
	const [logoError, setLogoError] = useState<string | null>(null)

	const form = useForm<CreateClientDTO>({
		resolver: zodResolver(mode === 'edit' ? updateClientSchema : createClientSchema),
		defaultValues: {
			name: '',
			email: '',
			phone: '',
			address: '',
			nit: '',
			businessName: '',
			reminderBeforeDueIntervalDays: null,
			reminderAfterDueIntervalDays: null,
			...defaultValues,
		},
	})

	const {
		control,
		handleSubmit,
		watch,
		formState: { errors },
	} = form
	const { getDirtyValues } = useDirtyValues(form)

	const clientName = watch('name') ?? ''
	const visibleLogoUrl = isExistingLogoRemoved ? null : initialLogoUrl

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
		// The client logo endpoint has no DELETE, so "removed" only ever clears a
		// pending pick. Kept in the union so the shape matches CompanyForm and a
		// delete route can be honoured later without touching call sites.
		return { type: 'keep' }
	}

	function submit(values: CreateClientDTO) {
		setLogoError(null)
		void onSubmit(values, getDirtyValues(values), buildLogoAction())
	}

	return (
		<>
			<View className="gap-2">
				<Text variant="title">{mode === 'create' ? 'Create New Client' : 'Edit Client'}</Text>
				<Text variant="muted">
					{mode === 'create'
						? 'Fill in the information below to create a new client.'
						: 'Update the client information below.'}
				</Text>
			</View>

			<LogoPickerField
				value={logo}
				onChange={setLogo}
				existingUrl={visibleLogoUrl}
				onRemove={handleRemoveLogo}
				required={false}
				label="Client logo"
				helperText={
					clientName
						? `Logo for ${clientName}. Optional, max 5MB.`
						: 'Optional. Square image, max 5MB (JPG, PNG, WebP).'
				}
				error={logoError ?? undefined}
				onError={setLogoError}
			/>

			<Divider />

			<View className="gap-4">
				<View className="gap-1">
					<Text className="font-sans-medium text-base text-foreground">Basic Information</Text>
					<Text variant="muted" className="text-sm">
						Essential client details and identification.
					</Text>
				</View>

				<Controller
					control={control}
					name="nit"
					render={({ field }) => (
						<Input
							label="NIT/ID"
							value={field.value ?? ''}
							onChangeText={field.onChange}
							onBlur={field.onBlur}
							error={errors.nit?.message}
							placeholder="Enter NIT or ID number..."
						/>
					)}
				/>

				<Controller
					control={control}
					name="businessName"
					render={({ field }) => (
						<Input
							label="Business Name"
							value={field.value ?? ''}
							onChangeText={field.onChange}
							onBlur={field.onBlur}
							error={errors.businessName?.message}
							placeholder="Enter business name..."
						/>
					)}
				/>

				<Controller
					control={control}
					name="name"
					render={({ field }) => (
						<Input
							label="Client Name"
							required
							value={field.value ?? ''}
							onChangeText={field.onChange}
							onBlur={field.onBlur}
							error={errors.name?.message}
							placeholder="Enter client name..."
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
							placeholder="Enter address..."
						/>
					)}
				/>
			</View>

			<Divider />

			<View className="gap-4">
				<View className="gap-1">
					<Text className="font-sans-medium text-base text-foreground">Contact Information</Text>
					<Text variant="muted" className="text-sm">
						Phone numbers and email addresses for communication.
					</Text>
				</View>

				<Controller
					control={control}
					name="email"
					render={({ field }) => (
						<Input
							label="Primary Email"
							required
							value={field.value ?? ''}
							onChangeText={field.onChange}
							onBlur={field.onBlur}
							error={errors.email?.message}
							autoCapitalize="none"
							autoComplete="email"
							keyboardType="email-address"
							placeholder="Enter primary email..."
						/>
					)}
				/>

				<View className="gap-1.5">
					<Controller
						control={control}
						name="phone"
						render={({ field }) => (
							<Input
								label="Primary Phone"
								value={field.value ?? ''}
								onChangeText={field.onChange}
								onBlur={field.onBlur}
								error={errors.phone?.message}
								keyboardType="phone-pad"
								autoComplete="tel"
								// The shared PHONE_REGEX demands full E.164, so the country
								// code is part of the value rather than a separate picker.
								placeholder="Enter primary phone..."
							/>
						)}
					/>
					<View className="flex-row items-center gap-2">
						<InfoIcon size={12} color="#58666a" />
						<Text className="min-w-0 flex-1 font-sans text-xs text-muted-foreground">
							Enter the number with country code. E.g.: +57 301 123 4567
						</Text>
					</View>
				</View>
			</View>

			<Divider />

			<View className="gap-4">
				<View className="gap-1">
					<Text className="font-sans-medium text-base text-foreground">Estimate reminders</Text>
					<Text variant="muted" className="text-sm">
						Optional: how often to send payment reminders for this client.
					</Text>
				</View>

				<View className="gap-1.5">
					<Controller
						control={control}
						name="reminderBeforeDueIntervalDays"
						render={({ field }) => (
							<NumericInput
								label="Reminder before due (days)"
								value={field.value}
								onChangeValue={field.onChange}
								onBlur={field.onBlur}
								error={errors.reminderBeforeDueIntervalDays?.message}
								decimal={false}
								allowNegative={false}
								placeholder="e.g. 3 (every 3 days)"
							/>
						)}
					/>
					<Text className="font-sans text-xs text-muted-foreground">
						Leave empty to disable. Send reminder every N days while Estimate is active (not yet
						past due).
					</Text>
				</View>

				<View className="gap-1.5">
					<Controller
						control={control}
						name="reminderAfterDueIntervalDays"
						render={({ field }) => (
							<NumericInput
								label="Reminder after due (days)"
								value={field.value}
								onChangeValue={field.onChange}
								onBlur={field.onBlur}
								error={errors.reminderAfterDueIntervalDays?.message}
								decimal={false}
								allowNegative={false}
								placeholder="e.g. 1 (every day)"
							/>
						)}
					/>
					<Text className="font-sans text-xs text-muted-foreground">
						Leave empty to disable. Send reminder every N days when Estimate is past due.
					</Text>
				</View>
			</View>

			{footer}

			<Divider />

			<View className="flex-row justify-end gap-3">
				{onCancel ? (
					<Button label="Cancel" variant="outline" disabled={isSubmitting} onPress={onCancel} />
				) : null}

				<Pressable
					accessibilityRole="button"
					accessibilityState={{ disabled: isSubmitting, busy: isSubmitting }}
					disabled={isSubmitting}
					onPress={() => void handleSubmit(submit)()}
					// ui-styling: borderCurve pairs with every borderRadius.
					style={{ borderCurve: 'continuous' }}
					className={`min-h-12 items-center justify-center rounded-lg bg-primary px-5 py-3 ${
						isSubmitting ? 'opacity-50' : ''
					}`}
				>
					<Text className="font-sans-semibold text-base text-primary-foreground">
						{isSubmitting ? submittingLabel : submitLabel}
					</Text>
				</Pressable>
			</View>
		</>
	)
}
