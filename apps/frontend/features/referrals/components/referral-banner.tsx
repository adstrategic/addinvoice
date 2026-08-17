"use client"

import { useState } from "react"
import { Gift, Loader2, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import {
	useAttachReferral,
	useDetachReferral,
	useMyReferral,
} from "@/hooks/use-referral"

/**
 * Referral state on the subscribe page.
 *
 * Two jobs. It shows an attached referral with a way to remove it — since
 * Stripe's promo code input is disabled at checkout, this is the customer's
 * only escape hatch from a stale or wrong referral cookie. And it accepts a
 * code by hand, which is the only way someone on a yearly plan can be
 * attributed at all, because yearly purchases carry no promotion code.
 */
export function ReferralBanner() {
	const { data: referral, isLoading } = useMyReferral()
	const attachReferral = useAttachReferral()
	const detachReferral = useDetachReferral()
	const [code, setCode] = useState("")

	if (isLoading) return null

	const handleApply = async () => {
		const trimmed = code.trim()
		if (!trimmed) return

		try {
			const applied = await attachReferral.mutateAsync(trimmed)
			setCode("")
			toast.success(`Referral from ${applied.referrerName} applied`)
		} catch (error: unknown) {
			toast.error("Could not apply that referral code", {
				description:
					error instanceof Error
						? error.message
						: "Check the code and try again",
			})
		}
	}

	const handleRemove = async () => {
		try {
			await detachReferral.mutateAsync()
			toast.success("Referral removed")
		} catch (error: unknown) {
			toast.error("Could not remove the referral", {
				description:
					error instanceof Error
						? error.message
						: "It may already have been applied to a payment",
			})
		}
	}

	if (referral) {
		return (
			<Card className="mb-8 border-primary/40 bg-primary/5">
				<CardContent className="flex flex-wrap items-center justify-between gap-3 py-4">
					<div className="flex items-start gap-3">
						<Gift className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
						<div>
							<p className="font-medium">
								Referred by {referral.referrerName} — {referral.discountPct}% off
								your first month
							</p>
							<p className="text-sm text-muted-foreground">
								Applies to monthly plans. Yearly is already discounted, so the
								referral discount does not stack.
							</p>
						</div>
					</div>
					{referral.status === "PENDING" && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleRemove}
							disabled={detachReferral.isPending}
						>
							{detachReferral.isPending ? (
								<Loader2 className="h-4 w-4 animate-spin" />
							) : (
								<>
									<X className="mr-1 h-4 w-4" />
									Remove
								</>
							)}
						</Button>
					)}
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="mb-8 border-dashed">
			<CardContent className="flex flex-wrap items-center gap-3 py-4">
				<label htmlFor="referral-code" className="text-sm font-medium">
					Have a referral code?
				</label>
				<Input
					id="referral-code"
					value={code}
					onChange={(event) => setCode(event.target.value)}
					onKeyDown={(event) => {
						if (event.key === "Enter") handleApply()
					}}
					placeholder="e.g. JUAN20"
					className="max-w-[200px] uppercase"
					autoComplete="off"
				/>
				<Button
					variant="secondary"
					onClick={handleApply}
					disabled={attachReferral.isPending || !code.trim()}
				>
					{attachReferral.isPending ? (
						<>
							<Loader2 className="mr-2 h-4 w-4 animate-spin" />
							Applying...
						</>
					) : (
						"Apply"
					)}
				</Button>
			</CardContent>
		</Card>
	)
}
