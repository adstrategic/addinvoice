import Svg, { Circle, Line, Path, Polyline, Rect } from 'react-native-svg'

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

/** lucide: chevron-right — settings rows that drill into a sub-screen. */
export function ChevronRightIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="m9 18 6-6-6-6" />
		</Svg>
	)
}

/** lucide: search */
export function SearchIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="m21 21-4.34-4.34" />
			<Path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
		</Svg>
	)
}

/** lucide: plus — the create FAB and "Add new client". */
export function PlusIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M5 12h14" />
			<Path d="M12 5v14" />
		</Svg>
	)
}

/** lucide: mic — the voice-create affordance. */
export function MicIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M12 19v3" />
			<Path d="M19 10v2a7 7 0 0 1-14 0v-2" />
			<Path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
		</Svg>
	)
}

/** lucide: ellipsis-vertical — the list-row menu trigger. */
export function MoreVerticalIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Circle cx="12" cy="12" r="1" fill={props.color ?? DEFAULTS.color} />
			<Circle cx="12" cy="5" r="1" fill={props.color ?? DEFAULTS.color} />
			<Circle cx="12" cy="19" r="1" fill={props.color ?? DEFAULTS.color} />
		</Svg>
	)
}

/** lucide: mail */
export function MailIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7" />
			<Rect x="2" y="4" width="20" height="16" rx="2" />
		</Svg>
	)
}

/** lucide: phone */
export function PhoneIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384" />
		</Svg>
	)
}

/** lucide: map-pin */
export function MapPinIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
			<Circle cx="12" cy="10" r="3" />
		</Svg>
	)
}

/** lucide: file-digit — the NIT / Tax ID row. */
export function FileDigitIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M15 2H6a2 2 0 0 0-2 2v6" />
			<Path d="M14 2v4a2 2 0 0 0 2 2h4" />
			<Path d="M20 8v14a2 2 0 0 1-2 2h-4" />
			<Path d="M2 14h2v6" />
			<Path d="M2 20h4" />
			<Rect x="8" y="14" width="4" height="6" rx="2" />
		</Svg>
	)
}

/** lucide: briefcase-business — the business-name row. */
export function BriefcaseIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M12 12h.01" />
			<Path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2" />
			<Path d="M22 13a18.15 18.15 0 0 1-20 0" />
			<Rect x="2" y="6" width="20" height="14" rx="2" />
		</Svg>
	)
}

/** lucide: user-check — the "Active" stat tile. */
export function UserCheckIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="m16 11 2 2 4-4" />
			<Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<Circle cx="9" cy="7" r="4" />
		</Svg>
	)
}

/** lucide: user-plus — the "New This Month" stat tile. */
export function UserPlusIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<Path d="M19 8v6" />
			<Path d="M22 11h-6" />
			<Circle cx="9" cy="7" r="4" />
		</Svg>
	)
}

/** lucide: users — the More tab's Clients-adjacent rows. */
export function UsersIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
			<Path d="M16 3.128a4 4 0 0 1 0 7.744" />
			<Path d="M22 21v-2a4 4 0 0 0-3-3.87" />
			<Circle cx="9" cy="7" r="4" />
		</Svg>
	)
}

/** lucide: triangle-alert — the delete confirmation. */
export function AlertTriangleIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
			<Path d="M12 9v4" />
			<Path d="M12 17h.01" />
		</Svg>
	)
}

/** lucide: eye — "View Details" in the row menu. */
export function EyeIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" />
			<Circle cx="12" cy="12" r="3" />
		</Svg>
	)
}

/** lucide: square-pen — "Edit" in the row menu. */
export function PencilIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M12 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
			<Path d="M18.375 2.625a1 1 0 0 1 3 3l-9.013 9.014a2 2 0 0 1-.853.505l-2.873.84a.5.5 0 0 1-.62-.62l.84-2.873a2 2 0 0 1 .506-.852z" />
		</Svg>
	)
}

/** lucide: trash-2 — the destructive row-menu action. */
export function TrashIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="M10 11v6" />
			<Path d="M14 11v6" />
			<Path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
			<Path d="M3 6h18" />
			<Path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
		</Svg>
	)
}

/** lucide: info — the phone-format hint under the phone field. */
export function InfoIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Circle cx="12" cy="12" r="10" />
			<Path d="M12 16v-4" />
			<Path d="M12 8h.01" />
		</Svg>
	)
}

/** lucide: log-out — sign out on the More tab. */
export function LogOutIcon(props: IconProps) {
	return (
		<Svg {...base(props)}>
			<Path d="m16 17 5-5-5-5" />
			<Path d="M21 12H9" />
			<Path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
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
