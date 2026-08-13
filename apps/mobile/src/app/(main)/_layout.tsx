import { Stack } from 'expo-router'

import { FunnelGuard } from '@/components/guards/funnel-guard'

/**
 * Authenticated shell. A plain native Stack for now — the five NativeTabs
 * arrive with the Clients feature, and FUNNEL_PATHS.dashboard already points at
 * /(main)/clients so that swap won't move any routes.
 */
export default function MainLayout() {
	return (
		<FunnelGuard requiredStep="dashboard">
			<Stack screenOptions={{ headerLargeTitle: true }} />
		</FunnelGuard>
	)
}
