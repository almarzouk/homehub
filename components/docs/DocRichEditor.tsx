"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import {
  Bold,
  Italic,
  Strikethrough,
  List,
  ListOrdered,
  Heading2,
  Undo2,
  Redo2,
  Minus,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

/** Backward-compatible: plain text → HTML paragraphs. */
export function normalizeDocContent(content: string): string {
  if (!content) return "";
  const trimmed = content.trim();
  if (trimmed.startsWith("<")) return content;
  return trimmed
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

interface DocRichEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
}

export default function DocRichEditor({
  content,
  onChange,
  placeholder,
  className,
}: DocRichEditorProps) {
  const { t } = useTranslation();

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit],
    content: normalizeDocContent(content),
    editorProps: {
      attributes: {
        class:
          "focus:outline-none min-h-full px-4 md:px-6 py-4 md:py-6 text-sm md:text-base leading-relaxed text-gray-800 dark:text-gray-200 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:ps-6 [&_ul]:mb-2 [&_ol]:list-decimal [&_ol]:ps-6 [&_ol]:mb-2 [&_p]:mb-2 [&_hr]:my-4 [&_hr]:border-gray-200 dark:[&_hr]:border-gray-700",
      },
    },
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
  });

  useEffect(() => {
    if (!editor) return;
    const normalized = normalizeDocContent(content);
    if (editor.getHTML() !== normalized) {
      editor.commands.setContent(normalized, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="flex-1 flex items-center justify-center rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const btn = (active: boolean) =>
    cn(
      "p-2 rounded-lg transition-colors flex-shrink-0",
      active
        ? "bg-violet-100 dark:bg-violet-950 text-violet-700 dark:text-violet-300"
        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
    );

  return (
    <div
      className={cn(
        "flex flex-col flex-1 min-h-0 rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden",
        className
      )}
    >
      <div className="flex items-center gap-0.5 px-2 py-1.5 border-b border-gray-200 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/80 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={btn(editor.isActive("bold"))}
          aria-label={t("docs.toolbar.bold")}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={btn(editor.isActive("italic"))}
          aria-label={t("docs.toolbar.italic")}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={btn(editor.isActive("strike"))}
          aria-label={t("docs.toolbar.strike")}
        >
          <Strikethrough className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={btn(editor.isActive("heading", { level: 2 }))}
          aria-label={t("docs.toolbar.heading")}
        >
          <Heading2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={btn(editor.isActive("bulletList"))}
          aria-label={t("docs.toolbar.bulletList")}
        >
          <List className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={btn(editor.isActive("orderedList"))}
          aria-label={t("docs.toolbar.orderedList")}
        >
          <ListOrdered className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className={btn(false)}
          aria-label={t("docs.toolbar.divider")}
        >
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-1 flex-shrink-0" />
        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className={cn(btn(false), "disabled:opacity-40")}
          aria-label={t("docs.toolbar.undo")}
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className={cn(btn(false), "disabled:opacity-40")}
          aria-label={t("docs.toolbar.redo")}
        >
          <Redo2 className="h-4 w-4" />
        </button>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto relative">
        {!editor.getText().trim() && placeholder && (
          <p className="pointer-events-none absolute top-4 md:top-6 start-4 md:start-6 text-gray-400 text-sm md:text-base">
            {placeholder}
          </p>
        )}
        <EditorContent editor={editor} className="h-full [&_.ProseMirror]:min-h-full" />
      </div>
    </div>
  );
}
