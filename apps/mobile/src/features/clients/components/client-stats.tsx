import { memo } from 'react'
import { View } from 'react-native'

import { Card, Text } from '@/components/ui'
import { UserCheckIcon, UserPlusIcon } from '@/components/ui/icons'

export type ClientStatsProps = {
	total: number
	active: number
	newThisMonth: number
}

/**
 * Port of the web `ClientStats.tsx`: an indigo "TOTAL CLIENTS" eyebrow above a
 * large count, then two tiles.
 *
 * Note `active === total` by construction — the backend has no inactive state
 * and returns the same count for both (`clients.service.ts:listClients`). Kept
 * for parity with the web rather than "fixed" here.
 */
export const ClientStats = memo(function ClientStats({
	total,
	active,
	newThisMonth,
}: ClientStatsProps) {
	return (
		<View className="gap-4">
			<View className="items-center gap-1">
				<Text className="font-sans-bold text-xs uppercase tracking-widest text-indigo-600">
					Total Clients
				</Text>
				<Text className="font-sans-bold text-5xl text-foreground">{String(total)}</Text>
			</View>

			<View className="flex-row gap-3">
				<StatTile label="Active" value={active} icon={<UserCheckIcon size={16} color="#4f46e5" />} />
				<StatTile
					label="New This Month"
					value={newThisMonth}
					icon={<UserPlusIcon size={16} color="#4f46e5" />}
				/>
			</View>
		</View>
	)
})

function StatTile({
	label,
	value,
	icon,
}: {
	label: string
	value: number
	icon: React.ReactNode
}) {
	return (
		<Card className="flex-1 gap-4">
			<View className="flex-row items-start justify-between gap-2">
				<Text
					className="min-w-0 flex-1 font-sans-bold text-xs uppercase tracking-wider text-muted-foreground"
					numberOfLines={2}
				>
					{label}
				</Text>
				<View
					// ui-styling: borderCurve pairs with every borderRadius.
					style={{ borderCurve: 'continuous' }}
					className="h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15"
				>
					{icon}
				</View>
			</View>

			{/* rendering-text-in-text-component: numbers are stringified so a 0 can
			    never leak out as a bare node. */}
			<Text className="font-sans-bold text-3xl text-foreground">{String(value)}</Text>
		</Card>
	)
}
