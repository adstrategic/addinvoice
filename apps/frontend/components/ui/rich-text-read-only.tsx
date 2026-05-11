"use client";

import { useEffect, useMemo } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/lib/utils";

function docFromUnknown(value: unknown): Record<string, unknown> {
  if (value == null) {
    return { type: "doc", content: [] };
  }
  if (typeof value === "string") {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: value }],
        },
      ],
    };
  }
  if (
    typeof value === "object" &&
    value !== null &&
    (value as { type?: string }).type === "doc"
  ) {
    return value as Record<string, unknown>;
  }
  return { type: "doc", content: [] };
}

const displayClasses = cn(
  "text-sm text-muted-foreground",
  "[&_.ProseMirror]:outline-none [&_.ProseMirror]:min-h-0 [&_.ProseMirror]:px-0 [&_.ProseMirror]:py-0",
  "[&_p]:my-1.5 [&_p:first-child]:mt-0 [&_p:last-child]:mb-0",
  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-5",
  "[&_li]:my-0.5 [&_strong]:font-semibold [&_em]:italic",
  "[&_h2]:mt-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-2 [&_h3]:text-sm [&_h3]:font-semibold",
);

export interface RichTextReadOnlyProps {
  value: unknown;
  className?: string;
}

/**
 * Renders TipTap/ProseMirror JSON (or legacy string) as formatted read-only content.
 */
export function RichTextReadOnly({ value, className }: RichTextReadOnlyProps) {
  const initialDoc = useMemo(() => docFromUnknown(value), [value]);

  const editor = useEditor({
    extensions: [StarterKit],
    content: initialDoc,
    editable: false,
    immediatelyRender: false,
  });

  useEffect(() => {
    if (!editor) return;
    editor.commands.setContent(docFromUnknown(value));
  }, [editor, value]);

  if (!editor) {
    return null;
  }

  return (
    <EditorContent
      editor={editor}
      className={cn(displayClasses, className)}
    />
  );
}
