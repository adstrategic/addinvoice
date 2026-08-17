"use client"

import { useAuth } from "@clerk/nextjs"
import { useEffect, useRef } from "react"
import { referralsService } from "@/features/referrals/service/referrals.service"

const REFERRAL_COOKIE_NAME = "addinvoice_ref"

function readReferralCookie(): string | null {
	if (typeof document === "undefined") return null

	const match = document.cookie
		.split("; ")
		.find((entry) => entry.startsWith(`${REFERRAL_COOKIE_NAME}=`))

	return match ? decodeURIComponent(match.split("=")[1] ?? "") : null
}

function clearReferralCookie() {
	document.cookie = `${REFERRAL_COOKIE_NAME}=; Max-Age=0; path=/`
}

/**
 * Attaches a referral code dropped by the /r/:code link once the user is
 * signed in and their workspace exists.
 *
 * The cookie cannot be consumed server-side at workspace creation: the
 * workspace is created by the Clerk webhook, where no browser cookie is
 * available. So the client hands it over on the first authenticated render.
 *
 * Deliberately silent — the referral is a side benefit, and a failure here must
 * never interrupt the signup it rides along with. It is also kept out of the
 * workspace-access middleware so referral logic stays clear of the one backend
 * file the mobile-app branch also modifies.
 */
export function ReferralAttacher() {
	const { isLoaded, isSignedIn } = useAuth()
	const hasAttempted = useRef(false)

	useEffect(() => {
		if (!isLoaded || !isSignedIn || hasAttempted.current) return

		const code = readReferralCookie()
		if (!code) return

		hasAttempted.current = true

		referralsService
			.attachReferral(code)
			.then(() => {
				clearReferralCookie()
			})
			.catch(() => {
				// Already converted, invalid, or self-referral. The cookie is cleared
				// either way so a rejected code stops being retried on every load.
				clearReferralCookie()
			})
	}, [isLoaded, isSignedIn])

	return null
}
