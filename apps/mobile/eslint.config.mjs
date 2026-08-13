import { config as reactInternalConfig } from '@addinvoice/eslint-config/react-internal'
import globals from 'globals'

export default [
	...reactInternalConfig,
	{
		rules: {
			// rendering-no-falsy-and (CRITICAL): `{count && <X/>}` renders a bare `0`
			// outside <Text> and hard-crashes release builds.
			'react/jsx-no-leaked-render': ['error', { validStrategies: ['ternary', 'coerce'] }],
		},
	},
	{
		// Build tooling runs in Node, not the RN runtime.
		files: ['*.config.js', '*.config.mjs'],
		languageOptions: { globals: globals.node },
		rules: { '@typescript-eslint/no-require-imports': 'off' },
	},
	{
		ignores: ['.expo/**', 'dist/**', 'android/**', 'ios/**', 'expo-env.d.ts'],
	},
]
