import Svg, { Line, Path, Polyline } from 'react-native-svg'

/**
 * Lucide icon paths redrawn with react-native-svg.
 *
 * The web app pulls these from `lucide-react`, which is DOM-only. Rather than
 * add an RN icon package for the handful of glyphs the funnel needs, the paths
 * are transcribed here so both apps render the same shapes. `expo-symbols` is
 * deliberately not used: SF Symbols are iOS-only and these screens must look
 * identical on Android.
 */
export type IconProps = {
	size?: number
	color?: string
	strokeWidth?: number
}

const DEFAULTS = {
	size: 24,
	color: '#020b0f',
	strokeWidth: 2,
}

function base({ size = DEFAULTS.size, color = DEFAULTS.color, strokeWidth = DEFAULTS.strokeWidth }: IconProps) {
	return {
		width: size,
		height: size,
		viewBox: '0 0 24 24',
		fill: 'none',
		stroke: color,
		strokeWidth,
		strokeLinecap: 'round' as const,
		strokeLinejoin: 'round' as const,
	}
}

/** lucide: building-2 — the setup header and the empty logo tile. */
export function BuildingIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" />
			<Path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" />
			<Path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" />
			<Path d="M10 6h4" />
			<Path d="M10 10h4" />
			<Path d="M10 14h4" />
			<Path d="M10 18h4" />
		</Svg>
	)
}

/** lucide: upload */
export function UploadIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
			<Polyline points="17 8 12 3 7 8" />
			<Line x1="12" x2="12" y1="3" y2="15" />
		</Svg>
	)
}

/** lucide: arrow-right */
export function ArrowRightIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M5 12h14" />
			<Path d="m12 5 7 7-7 7" />
		</Svg>
	)
}

/** lucide: arrow-left */
export function ArrowLeftIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M19 12H5" />
			<Path d="m12 19-7-7 7-7" />
		</Svg>
	)
}

/** lucide: check — the onboarding completion badge. */
export function CheckIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M20 6 9 17l-5-5" />
		</Svg>
	)
}

/** lucide: chevron-down — the select trigger affordance. */
export function ChevronDownIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="m6 9 6 6 6-6" />
		</Svg>
	)
}

/** lucide: bold */
export function BoldIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M6 12h9a4 4 0 0 1 0 8H7a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h7a4 4 0 0 1 0 8" />
		</Svg>
	)
}

/** lucide: italic */
export function ItalicIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Line x1="19" x2="10" y1="4" y2="4" />
			<Line x1="14" x2="5" y1="20" y2="20" />
			<Line x1="15" x2="9" y1="4" y2="20" />
		</Svg>
	)
}

/** lucide: heading-2 */
export function Heading2Icon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M4 12h8" />
			<Path d="M4 18V6" />
			<Path d="M12 18V6" />
			<Path d="M21 18h-4c0-4 4-3 4-6 0-1.5-2-2.5-4-1" />
		</Svg>
	)
}

/** lucide: heading-3 */
export function Heading3Icon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M4 12h8" />
			<Path d="M4 18V6" />
			<Path d="M12 18V6" />
			<Path d="M17.5 10.5c1.7-1 3.5 0 3.5 1.5a2 2 0 0 1-2 2" />
			<Path d="M17 17.5c2 1.5 4 .3 4-1.5a2 2 0 0 0-2-2" />
		</Svg>
	)
}

/** lucide: list */
export function ListIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Line x1="8" x2="21" y1="6" y2="6" />
			<Line x1="8" x2="21" y1="12" y2="12" />
			<Line x1="8" x2="21" y1="18" y2="18" />
			<Line x1="3" x2="3.01" y1="6" y2="6" />
			<Line x1="3" x2="3.01" y1="12" y2="12" />
			<Line x1="3" x2="3.01" y1="18" y2="18" />
		</Svg>
	)
}

/** lucide: list-ordered */
export function ListOrderedIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Line x1="10" x2="21" y1="6" y2="6" />
			<Line x1="10" x2="21" y1="12" y2="12" />
			<Line x1="10" x2="21" y1="18" y2="18" />
			<Path d="M4 6h1v4" />
			<Path d="M4 10h2" />
			<Path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1" />
		</Svg>
	)
}
