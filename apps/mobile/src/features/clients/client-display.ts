/**
 * Port of `getClientDisplayLines` from
 * `apps/frontend/components/shared/list-card.tsx`.
 *
 * A lot of workspaces set `businessName` to the same string as `name`; showing
 * both would render the line twice, so the subtitle is suppressed when they
 * match case-insensitively.
 */
export function getClientDisplayLines(
	client: { name?: string | null; businessName?: string | null } | null | undefined,
	fallback = 'Unknown Client',
) {
	const name = client?.name?.trim() || fallback
	const businessName = client?.businessName?.trim()
	const showBusinessName = !!businessName && businessName.toLowerCase() !== name.toLowerCase()

	return {
		name,
		businessName: showBusinessName ? businessName : undefined,
	}
}
