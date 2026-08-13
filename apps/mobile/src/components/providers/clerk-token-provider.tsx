import { useAuth } from '@clerk/expo'
import type { ReactNode } from 'react'

import { Spinner } from '@/components/ui'
import { setClerkTokenGetter } from '@/lib/api/client'

/**
 * Publishes Clerk's getToken to the module-level API client.
 *
 * The web app has a documented race here: QueryProvider mounts above this
 * provider, and React runs child effects before parent effects, so queries can
 * fire before the token getter exists and get an unauthenticated 401. Rather
 * than reproduce that, this provider renders nothing until Clerk is loaded — no
 * child query can mount before the getter is set.
 */
export function ClerkTokenProvider({ children }: { children: ReactNode }) {
	const { isLoaded, getToken } = useAuth()

	if (!isLoaded) {
		return <Spinner fullScreen />
	}

	setClerkTokenGetter(() => getToken())

	return <>{children}</>
}
