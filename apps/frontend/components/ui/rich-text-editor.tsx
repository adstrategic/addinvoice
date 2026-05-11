"use client"

import { useEffect, useState } from "react"
import { useEditor, EditorContent } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Bold, Italic, List, ListOrdered, Heading2, Heading3 } from "lucide-react"

/** StarterKit empty document shape (`getJSON()` when the editor has no text). */
const EMPTY_DOC: Record<string, unknown> = {
  type: "doc",
  content: [{ type: "paragraph" }],
}

function normalizeTipTapContent(value: unknown): Record<string, unknown> {
  if (value == null) return EMPTY_DOC
  if (typeof value === "string") return EMPTY_DOC
  if (typeof value !== "object" || Array.isArray(value)) return EMPTY_DOC
  const obj = value as Record<string, unknown>
  if (typeof obj.type !== "string") return EMPTY_DOC
  return obj
}

interface RichTextEditorProps {
  value: Record<string, unknown> | null | undefined
  onChange: (value: Record<string, unknown> | null) => void
  placeholder?: string
  className?: string
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = "Start typing...",
  className,
}: RichTextEditorProps) {
  const [, setContentSyncTick] = useState(0)
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: normalizeTipTapContent(value as unknown),
    editorProps: {
      attributes: {
        class: "min-h-[80px] px-3 py-2 text-sm focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.isEmpty ? null : (editor.getJSON() as Record<string, unknown>))
    },
  })

  // Keep TipTap in sync when the controlled value changes (e.g. react-hook-form reset after async load).
  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    const next = normalizeTipTapContent(value as unknown)
    const current = editor.getJSON() as Record<string, unknown>
    if (JSON.stringify(current) === JSON.stringify(next)) return
    editor.commands.setContent(next, { emitUpdate: false })
    // emitUpdate: false skips TipTap's React refresh; re-render so placeholder (editor.isEmpty) updates.
    setContentSyncTick((n) => n + 1)
  }, [editor, value])

  if (!editor) return null

  const toolbarBtn = (active: boolean) =>
    cn("px-2", active && "bg-accent text-accent-foreground")

  return (
    <div
      className={cn(
        "rounded-md border border-input bg-background focus-within:ring-2 focus-within:ring-ring/50",
        className,
      )}
    >
      <div className="flex flex-wrap gap-0.5 border-b border-input px-1 py-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Bold"
          aria-pressed={editor.isActive("bold")}
          className={toolbarBtn(editor.isActive("bold"))}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <Bold className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Italic"
          aria-pressed={editor.isActive("italic")}
          className={toolbarBtn(editor.isActive("italic"))}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Heading 2"
          aria-pressed={editor.isActive("heading", { level: 2 })}
          className={toolbarBtn(editor.isActive("heading", { level: 2 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        >
          <Heading2 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Heading 3"
          aria-pressed={editor.isActive("heading", { level: 3 })}
          className={toolbarBtn(editor.isActive("heading", { level: 3 }))}
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Bullet list"
          aria-pressed={editor.isActive("bulletList")}
          className={toolbarBtn(editor.isActive("bulletList"))}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </Button>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Ordered list"
          aria-pressed={editor.isActive("orderedList")}
          className={toolbarBtn(editor.isActive("orderedList"))}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative">
        <EditorContent
          editor={editor}
          className="[&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-4 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-4 [&_.ProseMirror_h2]:text-lg [&_.ProseMirror_h2]:font-bold [&_.ProseMirror_h3]:text-base [&_.ProseMirror_h3]:font-semibold"
        />
        {editor.isEmpty && (
          <p className="pointer-events-none absolute left-0 top-0 px-3 py-2 text-sm text-muted-foreground select-none">
            {placeholder}
          </p>
        )}
      </div>
    </div>
  )
}
