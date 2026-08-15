import { NativeTabs } from 'expo-router/unstable-native-tabs'

import { FunnelGuard } from '@/components/guards/funnel-guard'

/**
 * Authenticated shell — mirrors the web bottom nav in `components/bottom-nav.tsx`:
 * Home / Invoices / Estimates / Clients / More.
 *
 * navigation-native-navigators: NativeTabs, never @react-navigation/bottom-tabs.
 *
 * Icons pair `sf` (iOS SF Symbols) with `md` (Android Material glyph names from
 * expo-symbols). That combination needs no drawable resources and keeps the two
 * platforms visually matched, which is why the SF-Symbols caveat in
 * `components/ui/icons.tsx` does not apply here.
 *
 * Both sets are the **outline** variants, matching the web's outline lucide
 * icons — Material Symbols render outlined by default, and the SF names are the
 * non-`.fill` forms.
 *
 * Home, Invoices and Estimates are placeholders until their own phases land.
 * FUNNEL_PATHS.dashboard still points at `/(main)/clients`, so the funnel keeps
 * landing on the Clients tab.
 */

/** primary — the web nav's active `text-primary`. */
const ACTIVE = '#00a3ab'
/** muted-foreground — the web nav's inactive `text-muted-foreground`. */
const INACTIVE = '#58666a'
/**
 * Tab-bar surface. Deliberately *not* `background` (#ffffff): the screens behind
 * it are white, so a white bar has no visible edge and the nav reads as part of
 * the page. This is primary at ~4% — a cool tint that separates the bar without
 * looking like a different component.
 */
const SURFACE = '#f0f7f8'

/**
 * The hairline along the bar's top edge. Darker than `border` (#d7e0e2) so it
 * still registers against the tinted surface.
 */
const EDGE = '#c2d4d7'

/**
 * primary at ~18%, for the pill behind the active item — the web's
 * `bg-primary/10` needs to be stronger here to stay visible on `SURFACE` rather
 * than on white. Android draws this natively as the Material indicator; iOS has
 * no equivalent and simply tints the icon and label.
 */
const INDICATOR = '#d3ebed'

/**
 * The web uses `text-[10px] font-medium`. 11pt is the smallest size that stays
 * legible at native tab-bar density, and Geist is loaded at build time by the
 * expo-font config plugin.
 */
const LABEL_STYLE = { fontFamily: 'Geist-Medium', fontSize: 11 }

export default function MainLayout() {
	return (
		<FunnelGuard requiredStep="dashboard">
			<NativeTabs
				backgroundColor={SURFACE}
				// `none` rather than a blur material: a blur samples the white screen
				// behind the bar and washes SURFACE back out to near-white, which is
				// the exact problem the tint exists to solve. A flat surface also
				// matches Android, where there is no blur at all.
				blurEffect="none"
				// iOS: UIBarAppearance.shadowColor — a hairline separator along the top
				// edge, not a blurred drop shadow (UIKit exposes no radius here). On
				// Android the BottomNavigationView draws a real elevation shadow of its
				// own, so the two platforms arrive at a similar raised edge by
				// different means.
				shadowColor={EDGE}
				iconColor={{ default: INACTIVE, selected: ACTIVE }}
				labelStyle={{
					default: { ...LABEL_STYLE, color: INACTIVE },
					selected: { ...LABEL_STYLE, color: ACTIVE },
				}}
				indicatorColor={INDICATOR}
				rippleColor={INDICATOR}
				// The web nav is always visible and always labelled; keep both true
				// here rather than letting iOS 26 minimize it on scroll or Android
				// hide inactive labels.
				minimizeBehavior="never"
				labelVisibilityMode="labeled"
				// Without this the bar goes transparent when a list is scrolled to the
				// top, which reads as the nav disappearing over white screens.
				disableTransparentOnScrollEdge
			>
				<NativeTabs.Trigger name="(dashboard)">
					<NativeTabs.Trigger.Label>Home</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon sf="house" md="home" />
				</NativeTabs.Trigger>

				<NativeTabs.Trigger name="invoices">
					<NativeTabs.Trigger.Label>Invoices</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon sf="doc.text" md="description" />
				</NativeTabs.Trigger>

				<NativeTabs.Trigger name="estimates">
					<NativeTabs.Trigger.Label>Estimates</NativeTabs.Trigger.Label>
					{/* lucide FileCheck on the web — text lines with a checkmark. */}
					<NativeTabs.Trigger.Icon sf="text.badge.checkmark" md="task" />
				</NativeTabs.Trigger>

				<NativeTabs.Trigger name="clients">
					<NativeTabs.Trigger.Label>Clients</NativeTabs.Trigger.Label>
					<NativeTabs.Trigger.Icon sf="person.2" md="group" />
				</NativeTabs.Trigger>

				<NativeTabs.Trigger name="more">
					<NativeTabs.Trigger.Label>More</NativeTabs.Trigger.Label>
					{/* The web uses lucide `Menu`, not an ellipsis. */}
					<NativeTabs.Trigger.Icon sf="line.3.horizontal" md="menu" />
				</NativeTabs.Trigger>
			</NativeTabs>
		</FunnelGuard>
	)
}
