import { Text } from './text'

export type FieldLabelProps = {
	children: string
	/** Appends the web's red asterisk. */
	required?: boolean
	/** The muted treatment the web uses for the "Invoice defaults" sub-fields. */
	muted?: boolean
	className?: string
}

/**
 * Mirrors the web `FieldLabel`, including the `<span className="text-destructive">*</span>`
 * that marks required fields.
 */
export function FieldLabel({ children, required = false, muted = false, className }: FieldLabelProps) {
	return (
		<Text variant="label" className={muted ? `text-muted-foreground ${className ?? ''}` : className}>
			{children}
			{required ? <Text className="font-sans-medium text-sm text-destructive"> *</Text> : null}
		</Text>
	)
}
