"use client"

import { type ReactNode, useEffect } from "react"
import { FiX } from "react-icons/fi"

type AppModalProps = {
  isOpen: boolean
  title: string
  description?: string
  children: ReactNode
  onClose: () => void
}

export default function AppModal({
  isOpen,
  title,
  description,
  children,
  onClose,
}: AppModalProps) {
  useEffect(() => {
    if (!isOpen) {
      return
    }

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

  if (!isOpen) {
    return null
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      aria-describedby={description ? "modal-description" : undefined}
    >
      <div className="absolute inset-0" aria-hidden="true" onClick={onClose} />

      <div className="relative z-10 w-full max-w-2xl rounded-3xl border border-[var(--border-teal-soft)] bg-[var(--surface)] p-6 shadow-[var(--shadow-card)]">
        <div className="flex items-start justify-between gap-4">
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

        <div className="mt-6">{children}</div>
      </div>
    </div>
  )
}
