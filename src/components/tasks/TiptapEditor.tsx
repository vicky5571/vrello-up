"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Code,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { sanitizeHtml } from "@/lib/sanitize";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  editable?: boolean;
}

export function TiptapEditor({
  content,
  onChange,
  placeholder = "Write description or type '/' for commands...",
  editable = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
    ],
    content: sanitizeHtml(content),
    editable,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      onChange(sanitizeHtml(html));
    },
    editorProps: {
      attributes: {
        class:
          "prose dark:prose-invert prose-sm max-w-none focus:outline-hidden min-h-[140px] px-3.5 py-2.5 text-slate-800 dark:text-slate-200 text-xs leading-relaxed",
      },
    },
  });

  // Sync content if changed from outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(sanitizeHtml(content));
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="h-32 rounded-xl bg-slate-100 dark:bg-slate-800/40 animate-pulse border border-slate-200 dark:border-slate-800" />
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-white dark:bg-slate-900/80 focus-within:ring-2 focus-within:ring-teal-500/50 transition-all">
      {/* Editor Toolbar */}
      {editable && (
        <div className="flex flex-wrap items-center gap-0.5 p-1.5 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 text-xs">
          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={cn(
              "p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
              editor.isActive("bold") &&
                "bg-slate-200 dark:bg-slate-700 text-teal-600 dark:text-teal-400",
            )}
            title="Bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={cn(
              "p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
              editor.isActive("italic") &&
                "bg-slate-200 dark:bg-slate-700 text-teal-600 dark:text-teal-400",
            )}
            title="Italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={cn(
              "p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
              editor.isActive("strike") &&
                "bg-slate-200 dark:bg-slate-700 text-teal-600 dark:text-teal-400",
            )}
            title="Strikethrough"
          >
            <Strikethrough className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            className={cn(
              "p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
              editor.isActive("heading", { level: 1 }) &&
                "bg-slate-200 dark:bg-slate-700 text-teal-600 dark:text-teal-400",
            )}
            title="Heading 1"
          >
            <Heading1 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            className={cn(
              "p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
              editor.isActive("heading", { level: 2 }) &&
                "bg-slate-200 dark:bg-slate-700 text-teal-600 dark:text-teal-400",
            )}
            title="Heading 2"
          >
            <Heading2 className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1" />

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={cn(
              "p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
              editor.isActive("bulletList") &&
                "bg-slate-200 dark:bg-slate-700 text-teal-600 dark:text-teal-400",
            )}
            title="Bullet List"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={cn(
              "p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
              editor.isActive("orderedList") &&
                "bg-slate-200 dark:bg-slate-700 text-teal-600 dark:text-teal-400",
            )}
            title="Ordered List"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            className={cn(
              "p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
              editor.isActive("codeBlock") &&
                "bg-slate-200 dark:bg-slate-700 text-teal-600 dark:text-teal-400",
            )}
            title="Code Block"
          >
            <Code className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={cn(
              "p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
              editor.isActive("blockquote") &&
                "bg-slate-200 dark:bg-slate-700 text-teal-600 dark:text-teal-400",
            )}
            title="Quote"
          >
            <Quote className="w-3.5 h-3.5" />
          </button>

          <div className="w-px h-4 bg-slate-300 dark:bg-slate-700 mx-1 ml-auto" />

          <button
            type="button"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
            title="Undo"
          >
            <Undo className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => editor.chain().focus().redo()}
            disabled={!editor.can().redo()}
            className="p-1.5 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
            title="Redo"
          >
            <Redo className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Editor Content Area */}
      <EditorContent editor={editor} />
    </div>
  );
}
