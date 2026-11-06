"use client"

import { useEffect, useId, useRef, useState } from "react"
import { Extension } from "@tiptap/core"
import { EditorContent, useEditor } from "@tiptap/react"
import StarterKit from "@tiptap/starter-kit"
import { Markdown } from "@tiptap/markdown"
import { Plugin } from "@tiptap/pm/state"

type Props = {
  label: string
  value: string
  onChange: (value: string) => void
  maxLength: number
  disabled?: boolean
  rows?: number
}

export default function RichTextEditor({
  label,
  value,
  onChange,
  maxLength,
  disabled = false,
  rows = 5,
}: Props) {
  const id = useId()
  const lastValue = useRef(value)
  const [limitHit, setLimitHit] = useState(false)
  const editor = useEditor({
    immediatelyRender: false,
    shouldRerenderOnTransaction: true,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        blockquote: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: false,
        strike: false,
        underline: false,
      }),
      Markdown.configure({ markedOptions: { breaks: true } }),
      Extension.create({
        name: "storedTextLimit",
        addProseMirrorPlugins() {
          const instance = this.editor
          return [
            new Plugin({
              filterTransaction(transaction, state) {
                if (!transaction.docChanged) return true
                const length = instance.markdown!.serialize(
                  transaction.doc.toJSON(),
                ).length
                const previousLength = instance.markdown!.serialize(
                  state.doc.toJSON(),
                ).length
                if (length <= maxLength || length < previousLength) return true
                queueMicrotask(() => setLimitHit(true))
                return false
              },
            }),
          ]
        },
      }),
    ],
    content: value,
    contentType: "markdown",
    editable: !disabled,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-labelledby": `${id}-label`,
        "aria-describedby": `${id}-help`,
        class: "rich-text min-w-0 px-4 py-3 outline-none",
      },
    },
    onUpdate: ({ editor: current }) => {
      const next = current.isEmpty ? "" : current.getMarkdown()
      lastValue.current = next
      setLimitHit(false)
      onChange(next)
    },
  })

  useEffect(() => {
    editor?.setEditable(!disabled)
  }, [editor, disabled])
  useEffect(() => {
    if (editor && value !== lastValue.current) {
      editor.commands.setContent(value, {
        contentType: "markdown",
        emitUpdate: false,
      })
      lastValue.current = value
    }
  }, [editor, value])

  const tools = editor
    ? [
        {
          label: "Grassetto",
          active: editor.isActive("bold"),
          action: () => editor.chain().focus().toggleBold().run(),
        },
        {
          label: "Corsivo",
          active: editor.isActive("italic"),
          action: () => editor.chain().focus().toggleItalic().run(),
        },
        {
          label: "Titolo",
          active: editor.isActive("heading", { level: 2 }),
          action: () =>
            editor.chain().focus().toggleHeading({ level: 2 }).run(),
        },
        {
          label: "Elenco",
          active: editor.isActive("bulletList"),
          action: () => editor.chain().focus().toggleBulletList().run(),
        },
        {
          label: "Elenco numerato",
          active: editor.isActive("orderedList"),
          action: () => editor.chain().focus().toggleOrderedList().run(),
        },
      ]
    : []

  return (
    <div className="space-y-2">
      <p id={`${id}-label`} className="text-sm font-bold">
        {label}
      </p>
      <div className="overflow-hidden rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] focus-within:border-[var(--accent)]">
        <div
          role="group"
          aria-label={`Formattazione ${label}`}
          className="flex flex-wrap gap-1 border-b border-[var(--border-teal-soft)] p-2"
        >
          {tools.map((tool) => (
            <button
              key={tool.label}
              type="button"
              aria-pressed={tool.active}
              disabled={disabled}
              onMouseDown={(event) => event.preventDefault()}
              onClick={tool.action}
              className={`min-h-11 rounded-lg px-3 text-sm font-bold disabled:opacity-50 ${tool.active ? "bg-[var(--primary-dark)] text-white" : "text-[var(--text-soft)] hover:bg-[var(--surface-soft)]"}`}
            >
              {tool.label}
            </button>
          ))}
          <button
            type="button"
            disabled={disabled || !editor?.can().undo()}
            onClick={() => editor?.chain().focus().undo().run()}
            className="min-h-11 rounded-lg px-3 text-sm disabled:opacity-50"
          >
            Annulla modifica
          </button>
          <button
            type="button"
            disabled={disabled || !editor?.can().redo()}
            onClick={() => editor?.chain().focus().redo().run()}
            className="min-h-11 rounded-lg px-3 text-sm disabled:opacity-50"
          >
            Ripristina modifica
          </button>
        </div>
        <EditorContent
          editor={editor}
          className="rich-text-editor"
          style={{ minHeight: `${rows * 1.7}rem` }}
        />
      </div>
      <p id={`${id}-help`} className="text-xs text-[var(--text-muted)]">
        Seleziona il testo e scegli la formattazione. {value.length} /{" "}
        {maxLength} caratteri, formattazione inclusa.
      </p>
      {limitHit && (
        <p role="alert" className="text-sm text-[var(--text-danger)]">
          Limite di {maxLength} caratteri raggiunto. Riduci il testo o la
          formattazione per continuare.
        </p>
      )}
    </div>
  )
}
