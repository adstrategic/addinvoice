import { AuthView } from '@clerk/expo/native'

/**
 * The whole authentication surface.
 *
 * AuthView is rendered natively (SwiftUI / Jetpack Compose) and derives which
 * methods to offer from the Clerk Dashboard, so sign-in, sign-up, email codes,
 * password reset and MFA all live here. Replacing the hand-written flow removes
 * the class of bug where a custom screen assumed a factor the account lacks —
 * an account created through Google has no password, and only
 * `supportedFirstFactors` reveals that.
 *
 * There is no success callback: `(auth)/_layout.tsx` redirects to `/` once
 * `isSignedIn` flips, and `app/index.tsx` resolves the funnel step from there.
 * A brand-new user therefore lands on onboarding with no special casing.
 *
 * `isDismissible` is false because this is a route rather than a modal — there
 * is nothing behind it to dismiss to while signed out.
 */
export default function SignInScreen() {
	return <AuthView isDismissible={false} />
}
