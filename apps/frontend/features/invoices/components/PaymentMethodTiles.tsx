'use client'

import Image from 'next/image'
import { CreditCard } from 'lucide-react'
import { useWorkspacePaymentMethods } from '@/features/workspace'

interface PaymentMethodTilesProps {
	/** Currently selected payment method id, or null for "Manual". */
	value: number | null
	/** Called with the chosen payment method id, or null for "Manual". */
	onChange: (value: number | null) => void
}

const METHOD_LABELS: Record<
	string,
	{ name: string; icon: 'paypal' | 'zelle' | 'nequi' | 'stripe' }
> = {
	PAYPAL: { name: 'PayPal', icon: 'paypal' },
	ZELLE: { name: 'Zelle', icon: 'zelle' },
	NEQUI: { name: 'Nequi', icon: 'nequi' },
	STRIPE: { name: 'Stripe', icon: 'stripe' },
}

/**
 * Clickable tile picker for an invoice's payment method. Renders a "Manual"
 * tile (null) plus one tile per enabled workspace payment method (VENMO is
 * deprecated and excluded). Shared by the invoice form and the
 * change-payment-method dialog so both stay visually consistent.
 */
export function PaymentMethodTiles({ value, onChange }: PaymentMethodTilesProps) {
	const { data: paymentMethods } = useWorkspacePaymentMethods()
	const enabledPaymentMethods =
		paymentMethods?.filter((m) => m.isEnabled && m.type !== 'VENMO') ?? []

	return (
		<div className="grid gap-4 sm:grid-cols-2">
			<div
				className={`cursor-pointer rounded-lg border p-4 hover:bg-secondary/50 transition-colors ${value == null ? 'border-primary bg-secondary/50' : 'border-border'}`}
				onClick={() => onChange(null)}
			>
				<div className="flex items-center gap-3">
					<div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center">
						<CreditCard className="h-4 w-4 text-foreground" />
					</div>
					<span className="font-medium text-foreground">Manual</span>
				</div>
			</div>
			{enabledPaymentMethods.map((method) => {
				const label = METHOD_LABELS[method.type]
				const isSelected = value === method.id
				return (
					<div
						key={method.id}
						className={`cursor-pointer rounded-lg border p-4 hover:bg-secondary/50 transition-colors ${isSelected ? 'border-primary bg-secondary/50' : 'border-border'}`}
						onClick={() => onChange(method.id)}
					>
						<div className="flex items-center gap-3">
							{label?.icon === 'paypal' && (
								<Image
									src="/images/PayPal-icon.png"
									alt="PayPal"
									width={32}
									height={32}
									className="h-8 w-8 object-contain"
								/>
							)}
							{label?.icon === 'zelle' && (
								<Image
									src="/images/zelle-icon.png"
									alt="Zelle"
									width={32}
									height={32}
									className="h-8 w-8 object-contain"
								/>
							)}
							{label?.icon === 'stripe' && (
								<Image
									src="/images/stripe-icon.webp"
									alt="Stripe"
									width={32}
									height={32}
									className="h-8 w-8 object-contain"
								/>
							)}
							{label?.icon === 'nequi' && (
								<div className="h-8 w-8 rounded-full border border-border flex items-center justify-center text-xs font-semibold">
									NQ
								</div>
							)}
							<span className="font-medium text-foreground">
								{label?.name ?? method.type}
							</span>
						</div>
					</div>
				)
			})}
		</div>
	)
}
