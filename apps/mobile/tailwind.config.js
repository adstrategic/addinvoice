/**
 * Design tokens converted from apps/frontend/app/globals.css.
 * The web defines them as oklch() CSS vars under Tailwind v4's @theme; React Native
 * cannot parse oklch, so the light palette is mirrored here as hex.
 * Dark mode is deliberately not ported yet.
 */
/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./src/**/*.{js,jsx,ts,tsx}'],
	presets: [require('nativewind/preset')],
	theme: {
		extend: {
			colors: {
				background: '#ffffff',
				foreground: '#020b0f',
				card: { DEFAULT: '#ffffff', foreground: '#020b0f' },
				popover: { DEFAULT: '#ffffff', foreground: '#020b0f' },
				primary: {
					DEFAULT: '#00a3ab',
					light: '#00b1cc',
					dark: '#00424d',
					foreground: '#ffffff',
				},
				secondary: { DEFAULT: '#e3eef0', foreground: '#020b0f' },
				muted: { DEFAULT: '#e3eef0', foreground: '#58666a' },
				accent: { DEFAULT: '#e3eef0', foreground: '#020b0f' },
				destructive: { DEFAULT: '#d40924', foreground: '#ffffff' },
				border: '#d7e0e2',
				input: '#d7e0e2',
				ring: '#00a3ab',
				// Per-module accent, from apps/frontend/components/shared/list-card-theme.ts.
				// Clients are indigo there; each later module adds its own entry rather
				// than scattering hex literals through components.
				indigo: { 400: '#818cf8', 500: '#6366f1', 600: '#4f46e5' },
				chart: {
					1: '#00a3ab',
					2: '#615ed6',
					3: '#00a153',
					4: '#d83b00',
					5: '#a61b86',
				},
			},
			borderRadius: {
				sm: 6,
				md: 8,
				lg: 10,
				xl: 14,
			},
			// React Native does not synthesize weights, so each weight is its own family.
			// Named to avoid colliding with Tailwind's font-medium/font-bold weight utilities.
			fontFamily: {
				sans: ['Geist-Regular'],
				'sans-medium': ['Geist-Medium'],
				'sans-semibold': ['Geist-SemiBold'],
				'sans-bold': ['Geist-Bold'],
			},
		},
	},
	plugins: [],
}
