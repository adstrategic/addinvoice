'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { PaymentMethodTiles } from './PaymentMethodTiles'
import { useUpdateInvoicePaymentMethod } from '../hooks/useInvoices'
import type { InvoiceResponse } from '../schemas/invoice.schema'

interface ChangePaymentMethodDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	invoice: InvoiceResponse | null
}

/**
 * Popup for changing ONLY the payment method on an issued, unpaid invoice.
 * Reuses the invoice form's tile picker so the choice stays consistent with
 * invoice creation. Nothing else on the invoice can be edited here.
 */
export function ChangePaymentMethodDialog({
	open,
	onOpenChange,
	invoice,
}: ChangePaymentMethodDialogProps) {
	const updatePaymentMethod = useUpdateInvoicePaymentMethod()
	const currentValue = invoice?.selectedPaymentMethod?.id ?? null
	const [value, setValue] = useState<number | null>(currentValue)

	useEffect(() => {
		if (open) {
			setValue(invoice?.selectedPaymentMethod?.id ?? null)
		}
	}, [open, invoice])

	const isUnchanged = value === currentValue

	const handleSave = async () => {
		if (!invoice) return
		try {
			await updatePaymentMethod.mutateAsync({
				id: invoice.id,
				selectedPaymentMethodId: value,
			})
			onOpenChange(false)
		} catch {
			// Error toast handled by the mutation; keep the dialog open to retry.
		}
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-2xl">
				<DialogHeader>
					<DialogTitle>Change payment method</DialogTitle>
					<DialogDescription>
						Update how the client can pay this invoice. Nothing else on the
						invoice changes.
					</DialogDescription>
				</DialogHeader>
				<PaymentMethodTiles value={value} onChange={setValue} />
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="button"
						onClick={handleSave}
						disabled={updatePaymentMethod.isPending || isUnchanged}
					>
						{updatePaymentMethod.isPending ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...
							</>
						) : (
							'Save'
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	)
}
