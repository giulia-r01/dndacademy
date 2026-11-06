"use client"

import { FiInfo } from "react-icons/fi"

export default function CharacterInfo({ label, explanation }: { label: string; explanation: string }) {
  return (
    <details
      className="text-sm"
      onKeyDown={event => {
        if (event.key === "Escape" && event.currentTarget.open) {
          event.stopPropagation()
          event.currentTarget.open = false
          event.currentTarget.querySelector("summary")?.focus()
        }
      }}
    >
      <summary
        aria-label={`Informazioni su ${label}`}
        className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg font-bold text-[var(--text-soft)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] [&::-webkit-details-marker]:hidden"
      >
        <span>{label}</span>
        <FiInfo size={19} aria-hidden="true" className="shrink-0 text-[var(--accent-soft)]" />
      </summary>
      <p className="mb-3 border-t border-[var(--border-teal-soft)] pt-3 leading-6 text-[var(--text-soft)]">{explanation}</p>
    </details>
  )
}
