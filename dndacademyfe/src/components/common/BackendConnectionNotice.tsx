"use client"

import { useSyncExternalStore } from "react"
import { FiLoader } from "react-icons/fi"
import {
  getPendingBackendRequests,
  getServerBackendRequests,
  subscribeToBackendRequests,
} from "@/lib/backend-activity"

export default function BackendConnectionNotice() {
  const pending = useSyncExternalStore(
    subscribeToBackendRequests,
    getPendingBackendRequests,
    getServerBackendRequests,
  )
  if (pending === 0) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-4 z-[80] mx-auto flex max-w-lg items-start gap-3 rounded-2xl border border-[var(--border-gold)] bg-[var(--surface)] p-4 text-[var(--text-main)] shadow-lg"
    >
      <FiLoader
        aria-hidden="true"
        className="mt-1 shrink-0 animate-spin text-[var(--accent-soft)] motion-reduce:animate-none"
        size={22}
      />
      <div>
        <p className="font-bold">Collegamento a D&D Academy in corso</p>
        <p className="mt-1 text-sm text-[var(--text-soft)]">
          Stiamo preparando il tuo accesso. Attendi qualche istante: il
          collegamento è ancora in corso.
        </p>
      </div>
    </div>
  )
}
