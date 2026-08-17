import { NextResponse } from "next/server"

/** How long a referral click stays attributable. */
const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60 // 60 days

export const REFERRAL_COOKIE_NAME = "addinvoice_ref"

/**
 * GET /r/:code — referral landing route.
 *
 * Drops a cookie the app reads once the user is signed in, then sends the
 * visitor to sign-up. A route handler rather than a page: there is nothing to
 * render, and redirecting from the server avoids a flash.
 *
 * The code is deliberately *not* verified against the backend here. The attach
 * endpoint is the real authority — it rejects unknown and paused codes, and the
 * attacher clears the cookie when it does. Checking here would buy only the
 * avoidance of a harmless junk cookie, while making attribution depend on the
 * backend being reachable at click time: a redeploy mid-click would silently
 * lose the referral. A malformed code still redirects with no cookie set,
 * because a broken link must cost a commission, never a signup.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ code: string }> },
) {
	const { code } = await params
	const signUpUrl = new URL("/sign-up", request.url)
	const redirect = NextResponse.redirect(signUpUrl)

	const normalisedCode = code.trim().toUpperCase()

	if (!/^[A-Z0-9]{3,32}$/.test(normalisedCode)) {
		return redirect
	}

	redirect.cookies.set(REFERRAL_COOKIE_NAME, normalisedCode, {
		httpOnly: false, // read by the client component that attaches it
		maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
		path: "/",
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
	})

	return redirect
}
