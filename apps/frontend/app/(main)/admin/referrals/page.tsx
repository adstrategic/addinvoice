"use client"

import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { ArrowLeft, Loader2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card"
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from "@/components/ui/table"
import {
	referralsAdminService,
	type ReferrerTotals,
} from "@/features/referrals/service/referrals-admin.service"

function formatMoney(cents: number, currency: string) {
	return new Intl.NumberFormat("en-US", {
		style: "currency",
		currency,
	}).format(cents / 100)
}

function formatDate(value: string | null) {
	if (!value) return "—"
	return new Date(value).toLocaleDateString()
}

/** Owed = approved and not yet paid. Pending is still inside the hold window. */
function TotalsCell({ totals }: { totals: ReferrerTotals[] }) {
	if (totals.length === 0) return <span className="text-muted-foreground">—</span>

	return (
		<div className="space-y-1">
			{totals.map((total) => (
				<div key={total.currency} className="whitespace-nowrap text-sm">
					<span className="font-medium">
						{formatMoney(total.approvedCents, total.currency)}
					</span>
					<span className="text-muted-foreground">
						{" "}
						owed · {formatMoney(total.pendingCents, total.currency)} pending
					</span>
				</div>
			))}
		</div>
	)
}

function ReferrerList({ onSelect }: { onSelect: (id: number) => void }) {
	const { data, isLoading, error } = useQuery({
		queryKey: ["admin", "referrers"],
		queryFn: () => referralsAdminService.listReferrers(),
	})

	if (isLoading) {
		return (
			<div className="flex items-center gap-2 py-12 text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				Loading referrers...
			</div>
		)
	}

	if (error) {
		return (
			<p className="py-12 text-muted-foreground">
				Could not load referrers. This page is restricted to admin accounts.
			</p>
		)
	}

	if (!data || data.length === 0) {
		return (
			<p className="py-12 text-muted-foreground">
				No referrers yet. Create one with the create-referrer script.
			</p>
		)
	}

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead>Referrer</TableHead>
					<TableHead>Code</TableHead>
					<TableHead>Rate</TableHead>
					<TableHead>Referrals</TableHead>
					<TableHead>Commission</TableHead>
					<TableHead />
				</TableRow>
			</TableHeader>
			<TableBody>
				{data.map((referrer) => (
					<TableRow key={referrer.id}>
						<TableCell>
							<div className="font-medium">{referrer.name}</div>
							<div className="text-sm text-muted-foreground">
								{referrer.email}
							</div>
						</TableCell>
						<TableCell>
							<code className="rounded bg-muted px-2 py-1 text-sm">
								{referrer.code}
							</code>
							{referrer.status === "PAUSED" && (
								<Badge variant="secondary" className="ml-2">
									Paused
								</Badge>
							)}
						</TableCell>
						<TableCell className="whitespace-nowrap">
							{referrer.commissionRatePct}% · {referrer.commissionMonths}mo
						</TableCell>
						<TableCell>
							{referrer.convertedCount} paid / {referrer.referralCount} total
						</TableCell>
						<TableCell>
							<TotalsCell totals={referrer.totals} />
						</TableCell>
						<TableCell>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => onSelect(referrer.id)}
							>
								View
							</Button>
						</TableCell>
					</TableRow>
				))}
			</TableBody>
		</Table>
	)
}

function ReferrerDetail({
	referrerId,
	onBack,
}: {
	referrerId: number
	onBack: () => void
}) {
	const { data, isLoading } = useQuery({
		queryKey: ["admin", "referrers", referrerId],
		queryFn: () => referralsAdminService.getReferrer(referrerId),
	})

	if (isLoading || !data) {
		return (
			<div className="flex items-center gap-2 py-12 text-muted-foreground">
				<Loader2 className="h-4 w-4 animate-spin" />
				Loading...
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<Button variant="ghost" size="sm" onClick={onBack}>
				<ArrowLeft className="mr-1 h-4 w-4" />
				All referrers
			</Button>

			<Card>
				<CardHeader>
					<CardTitle>{data.name}</CardTitle>
					<CardDescription>
						{data.email} · code {data.code} · {data.commissionRatePct}% for{" "}
						{data.commissionMonths} months
					</CardDescription>
				</CardHeader>
				<CardContent>
					<TotalsCell totals={data.totals} />
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Referrals</CardTitle>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Workspace</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Attributed</TableHead>
								<TableHead>Converted</TableHead>
								<TableHead>Commission ends</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.referrals.map((referral) => (
								<TableRow key={referral.id}>
									<TableCell>{referral.workspaceName}</TableCell>
									<TableCell>
										<Badge
											variant={
												referral.status === "CONVERTED" ? "default" : "secondary"
											}
										>
											{referral.status}
										</Badge>
									</TableCell>
									<TableCell>{formatDate(referral.attributedAt)}</TableCell>
									<TableCell>{formatDate(referral.convertedAt)}</TableCell>
									<TableCell>{formatDate(referral.commissionEndsAt)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle className="text-lg">Commission ledger</CardTitle>
					<CardDescription>
						Negative rows are refund and dispute reversals.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Date</TableHead>
								<TableHead>Base</TableHead>
								<TableHead>Commission</TableHead>
								<TableHead>Status</TableHead>
								<TableHead>Payable from</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{data.commissions.map((commission) => (
								<TableRow key={commission.id}>
									<TableCell>{formatDate(commission.createdAt)}</TableCell>
									<TableCell>
										{formatMoney(
											commission.baseAmountCents,
											commission.currency,
										)}
									</TableCell>
									<TableCell
										className={
											commission.amountCents < 0
												? "text-destructive"
												: undefined
										}
									>
										{formatMoney(commission.amountCents, commission.currency)}
									</TableCell>
									<TableCell>
										<Badge variant="secondary">{commission.status}</Badge>
									</TableCell>
									<TableCell>{formatDate(commission.availableAt)}</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				</CardContent>
			</Card>
		</div>
	)
}

/**
 * Read-only view of the referral program. Referrers are created and payouts
 * recorded with the backend scripts; this page exists to answer "what do I owe
 * whom" without opening the database.
 */
export default function AdminReferralsPage() {
	const [selectedId, setSelectedId] = useState<number | null>(null)

	return (
		<div className="p-6">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Referrals</h1>
				<p className="text-muted-foreground">
					Referrers, their conversions, and commission owed.
				</p>
			</div>

			{selectedId === null ? (
				<ReferrerList onSelect={setSelectedId} />
			) : (
				<ReferrerDetail
					referrerId={selectedId}
					onBack={() => setSelectedId(null)}
				/>
			)}
		</div>
	)
}
