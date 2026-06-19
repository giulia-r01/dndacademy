"use client"

import { type ReactNode, useEffect } from "react"
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
  useEffect(() => {
    if (!isOpen) return

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose()
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    document.body.style.overflow = "hidden"

    return () => {
      document.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ""
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-black/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div className="fixed inset-0" aria-hidden="true" onClick={onClose} />

      <div
        className={[
          "relative z-10 flex max-h-[calc(100vh-3rem)] w-full flex-col rounded-3xl border border-[var(--border-teal-soft)] bg-[var(--surface)] shadow-[var(--shadow-card)]",
          sizeClasses[size],
        ].join(" ")}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-[var(--border-teal-soft)]/60 p-6">
          <div>
            <h2
              id="modal-title"
              className="text-2xl font-black text-[var(--text-main)]"
            >
              {title}
            </h2>

            {description && (
              <p
                id="modal-description"
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
