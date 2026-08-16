import { NextResponse } from "next/server"

/** How long a referral click stays attributable. */
const REFERRAL_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 60 // 60 days

export const REFERRAL_COOKIE_NAME = "addinvoice_ref"

/**
 * GET /r/:code — referral landing route.
 *
 * Validates the code, drops a cookie the app reads once the user is signed in,
 * and sends the visitor to sign-up. A route handler rather than a page: there
 * is nothing to render, and redirecting from the server avoids a flash.
 *
 * An unknown, paused or unreachable code still redirects to sign-up with no
 * cookie set. A broken referral link must cost a commission, never a signup.
 */
export async function GET(
	request: Request,
	{ params }: { params: Promise<{ code: string }> },
) {
	const { code } = await params
	const signUpUrl = new URL("/sign-up", request.url)

	const normalisedCode = code.trim().toUpperCase()

	if (!/^[A-Z0-9]{3,32}$/.test(normalisedCode)) {
		return NextResponse.redirect(signUpUrl)
	}

	// This runs server-side. In Docker the frontend container cannot reach the
	// backend on localhost — that is itself — so INTERNAL_API_URL points at the
	// backend service on the compose network. Falls back to the public URL for
	// non-containerised runs.
	const apiUrl =
		process.env.INTERNAL_API_URL ||
		process.env.NEXT_PUBLIC_API_URL ||
		"http://localhost:4000"

	let isValid = false

	try {
		const response = await fetch(
			`${apiUrl}/api/v1/public/referrals/${normalisedCode}`,
			{ cache: "no-store" },
		)

		if (response.ok) {
			const body = (await response.json()) as { data?: { valid?: boolean } }
			isValid = body.data?.valid === true
		}
	} catch {
		// Backend unreachable — fall through and redirect without a cookie.
	}

	const redirect = NextResponse.redirect(signUpUrl)

	if (isValid) {
		redirect.cookies.set(REFERRAL_COOKIE_NAME, normalisedCode, {
			httpOnly: false, // read by the client component that attaches it
			maxAge: REFERRAL_COOKIE_MAX_AGE_SECONDS,
			path: "/",
			sameSite: "lax",
			secure: process.env.NODE_ENV === "production",
		})
	}

	return redirect
}
