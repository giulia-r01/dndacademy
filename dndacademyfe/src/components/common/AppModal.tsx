"use client"

import { type ReactNode, useEffect, useLayoutEffect, useId, useRef } from "react"
import { FiX } from "react-icons/fi"

type AppModalSize = "sm" | "md" | "lg" | "xl"

type AppModalProps = {
  isOpen: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
  size?: AppModalSize
}

const sizeClasses: Record<AppModalSize, string> = {
  sm: "max-w-md",
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
}

export default function AppModal({
  isOpen,
  title,
  description,
  children,
  onClose,
  size = "md",
}: AppModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  const titleId = useId()
  const descriptionId = useId()

  useEffect(() => { closeRef.current = onClose }, [onClose])

  useLayoutEffect(() => {
    if (!isOpen) return
    const panel = panelRef.current
    if (!panel) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    const focusable = () => Array.from(panel.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
    )).filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'))
    const initial = focusable().find(element => element.matches('input, select, textarea'))
    ;(initial ?? focusable()[0] ?? panel).focus()

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        closeRef.current()
      }
      if (event.key === "Tab") {
        const items = focusable()
        const index = items.indexOf(document.activeElement as HTMLElement)
        if (!items.length) {
          event.preventDefault()
          panel!.focus()
        } else if (event.shiftKey && index <= 0) {
          event.preventDefault()
          items.at(-1)!.focus()
        } else if (!event.shiftKey && (index < 0 || index === items.length - 1)) {
          event.preventDefault()
          items[0].focus()
        }
      }
    }
    function containFocus(event: FocusEvent) {
      if (!panel!.contains(event.target as Node)) (focusable()[0] ?? panel!).focus()
    }
    document.addEventListener("keydown", handleKeyDown)
    document.addEventListener("focusin", containFocus)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.removeEventListener("focusin", containFocus)
      document.body.style.overflow = previousOverflow
      if (opener?.isConnected) opener.focus()
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className="fixed inset-0" aria-hidden="true" onClick={onClose} />

      <div
        ref={panelRef}
        tabIndex={-1}
        className={[
          "relative z-10 flex max-h-[calc(100vh-3rem)] w-full flex-col rounded-3xl border border-[var(--border-teal-soft)] bg-[var(--surface)] shadow-[var(--shadow-card)]",
          sizeClasses[size],
        ].join(" ")}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border-teal-soft)]/60 p-6">
          <div>
            <h2
              id={titleId}
              className="text-2xl font-black text-[var(--text-main)]"
            >
              {title}
            </h2>

            {description && (
              <p
                id={descriptionId}
                className="mt-2 text-sm leading-6 text-[var(--text-muted)]"
              >
                {description}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[var(--text-soft)] transition hover:bg-[var(--surface-muted)] hover:text-[var(--text-main)]"
            aria-label="Chiudi modale"
          >
            <FiX size={22} aria-hidden="true" />
          </button>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
          {children}
        </div>
      </div>
    </div>
  )
}
