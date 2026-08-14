import {
	RichText,
	useBridgeState,
	useEditorBridge,
	useEditorContent,
} from '@10play/tentap-editor'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'

import {
	BoldIcon,
	Heading2Icon,
	Heading3Icon,
	ItalicIcon,
	ListIcon,
	ListOrderedIcon,
	type IconProps,
} from '@/components/ui/icons'
import { Text } from '@/components/ui/text'
import { cn } from '@/lib/utils'

import { isEmptyTipTapDoc, RICH_TEXT_BRIDGE_EXTENSIONS } from './bridge-extensions'

/** foreground / muted-foreground, matching the toolbar states on web. */
const ICON_ACTIVE = '#020b0f'
const ICON_IDLE = '#58666a'

/**
 * Typography for the document inside the WebView.
 *
 * The editor runs in a WebView, so app-level NativeWind classes cannot reach
 * it. Geist is not loaded inside the WebView either — only into the native
 * runtime — so the document falls back to the platform UI font, which is the
 * closest match available without shipping the font file into the bundle.
 */
const EDITOR_CSS = `
	.ProseMirror {
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
		font-size: 16px;
		line-height: 1.5;
		color: #020b0f;
		padding: 12px 16px;
		margin: 0;
	}
	.ProseMirror:focus { outline: none; }
	.ProseMirror p { margin: 0 0 8px; }
	.ProseMirror p:last-child { margin-bottom: 0; }
	.ProseMirror h2 { font-size: 20px; font-weight: 600; margin: 0 0 8px; }
	.ProseMirror h3 { font-size: 18px; font-weight: 600; margin: 0 0 8px; }
	.ProseMirror ul, .ProseMirror ol { margin: 0 0 8px; padding-left: 22px; }
	.ProseMirror li { margin: 0 0 4px; }
	.ProseMirror blockquote {
		border-left: 3px solid #d7e0e2;
		margin: 0 0 8px;
		padding-left: 12px;
		color: #58666a;
	}
	.ProseMirror p.is-editor-empty:first-child::before {
		color: #58666a;
		content: attr(data-placeholder);
		float: left;
		height: 0;
		pointer-events: none;
	}
`

type ToolbarButtonProps = {
	label: string
	isActive: boolean
	isDisabled?: boolean
	onPress: () => void
	Icon: (props: IconProps) => React.JSX.Element
}

function ToolbarButton({ label, isActive, isDisabled = false, onPress, Icon }: ToolbarButtonProps) {
	return (
		<Pressable
			accessibilityRole="button"
			accessibilityLabel={label}
			accessibilityState={{ selected: isActive, disabled: isDisabled }}
			disabled={isDisabled}
			onPress={onPress}
			style={{ borderCurve: 'continuous' }}
			className={cn(
				'h-9 w-9 items-center justify-center rounded-md',
				isActive ? 'bg-accent' : 'bg-transparent',
				isDisabled ? 'opacity-40' : '',
			)}
		>
			<Icon size={16} color={isActive ? ICON_ACTIVE : ICON_IDLE} />
		</Pressable>
	)
}

export type RichTextEditorProps = {
	/** TipTap ProseMirror JSON, or null for an empty field. Read once, at mount. */
	value: Record<string, unknown> | null | undefined
	/** Receives ProseMirror JSON, or `null` when the document is empty. */
	onChange: (value: Record<string, unknown> | null) => void
	placeholder?: string
	/** Height of the editing surface. The toolbar sits above it. */
	height?: number
	/** Renders the web's "Clear text" action beneath the box. */
	showClear?: boolean
	error?: string
}

/**
 * TipTap editing with full web parity, via `@10play/tentap-editor`.
 *
 * TenTap is TipTap + ProseMirror in a WebView with a native bridge, so
 * `getJSON()` returns the same ProseMirror JSON the database stores and
 * `apps/pdf-service` consumes — no HTML conversion layer, unlike
 * `react-native-pell-rich-editor` or Quill.
 *
 * **This is the only place `bridgeExtensions` may be configured.** Screens must
 * never pass their own; see `bridge-extensions.ts` for why the whitelist is
 * load-bearing rather than an optimisation.
 *
 * Each instance is a WebView, so keep the number mounted per screen small.
 */
export function RichTextEditor({
	value,
	onChange,
	placeholder = 'Start typing…',
	height = 160,
	showClear = true,
	error,
}: RichTextEditorProps) {
	// Captured at mount: pushing `value` back down on every render would fight
	// the user's typing, since the WebView owns the document once it is live.
	const initialContentRef = useRef(value ?? undefined)
	const [hasContent, setHasContent] = useState(!isEmptyTipTapDoc(value))

	const editor = useEditorBridge({
		bridgeExtensions: RICH_TEXT_BRIDGE_EXTENSIONS,
		initialContent: initialContentRef.current,
		avoidIosKeyboard: true,
		autofocus: false,
	})

	const state = useBridgeState(editor)
	const content = useEditorContent(editor, { type: 'json', debounceInterval: 300 })

	// Styling and placeholder can only be applied once the document exists.
	useEffect(() => {
		if (!state.isReady) return
		editor.injectCSS(EDITOR_CSS, 'rich-text-editor')
		editor.setPlaceholder(placeholder)
	}, [editor, state.isReady, placeholder])

	// Compared as a string because the bridge hands back a fresh object each
	// tick; without this the form would be marked dirty on every keystroke pause.
	const lastEmittedRef = useRef<string | null>(null)

	useEffect(() => {
		if (content === undefined) return

		const isEmpty = isEmptyTipTapDoc(content)
		const next = isEmpty ? null : (content as Record<string, unknown>)
		const serialized = JSON.stringify(next ?? null)

		if (serialized === lastEmittedRef.current) return
		lastEmittedRef.current = serialized

		setHasContent(!isEmpty)
		onChange(next)
	}, [content, onChange])

	function handleClear() {
		editor.setContent('')
		setHasContent(false)
		lastEmittedRef.current = JSON.stringify(null)
		onChange(null)
	}

	return (
		<View className="gap-1.5">
			<View
				style={{ borderCurve: 'continuous' }}
				className={cn(
					'overflow-hidden rounded-lg border bg-background',
					error ? 'border-destructive' : 'border-input',
				)}
			>
				<View className="flex-row items-center gap-0.5 border-b border-input px-1 py-1">
					<ToolbarButton
						label="Bold"
						Icon={BoldIcon}
						isActive={state.isBoldActive}
						isDisabled={!state.canToggleBold}
						onPress={() => editor.toggleBold()}
					/>
					<ToolbarButton
						label="Italic"
						Icon={ItalicIcon}
						isActive={state.isItalicActive}
						isDisabled={!state.canToggleItalic}
						onPress={() => editor.toggleItalic()}
					/>
					<ToolbarButton
						label="Heading 2"
						Icon={Heading2Icon}
						isActive={state.headingLevel === 2}
						isDisabled={!state.canToggleHeading}
						onPress={() => editor.toggleHeading(2)}
					/>
					<ToolbarButton
						label="Heading 3"
						Icon={Heading3Icon}
						isActive={state.headingLevel === 3}
						isDisabled={!state.canToggleHeading}
						onPress={() => editor.toggleHeading(3)}
					/>
					<ToolbarButton
						label="Bullet list"
						Icon={ListIcon}
						isActive={state.isBulletListActive}
						isDisabled={!state.canToggleBulletList}
						onPress={() => editor.toggleBulletList()}
					/>
					<ToolbarButton
						label="Numbered list"
						Icon={ListOrderedIcon}
						isActive={state.isOrderedListActive}
						isDisabled={!state.canToggleOrderedList}
						onPress={() => editor.toggleOrderedList()}
					/>
				</View>

				<View style={{ height }}>
					<RichText editor={editor} />
				</View>
			</View>

			{showClear ? (
				<Pressable
					accessibilityRole="button"
					accessibilityState={{ disabled: !hasContent }}
					disabled={!hasContent}
					onPress={handleClear}
					className="py-2"
				>
					<Text
						className={cn(
							'text-center font-sans text-xs',
							hasContent ? 'text-muted-foreground' : 'text-muted-foreground opacity-40',
						)}
					>
						Clear text
					</Text>
				</Pressable>
			) : null}

			{error ? <Text variant="error">{error}</Text> : null}
		</View>
	)
}
