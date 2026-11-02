"use client"

import { FiMenu } from "react-icons/fi"
import type { UserProfile } from "@/types/user"
import AccountMenu from "@/components/layout/AccountMenu"
import { usePathname } from "next/navigation"
import { pageTitle } from "@/lib/navigation"

type TopbarProps = {
  onMenuClick: () => void
  user: UserProfile | null
  onLogout: () => void
}

export default function Topbar({ onMenuClick, user, onLogout }: TopbarProps) {
  const pathname = usePathname()
  return (
    <header className="border-b border-[var(--border-teal-soft)] bg-[var(--bg-topbar)] px-4 py-4 sm:px-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={onMenuClick}
            className="rounded-xl p-2 text-[var(--text-soft)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-main)] lg:hidden"
            aria-label="Apri menu di navigazione"
          >
            <FiMenu size={24} aria-hidden="true" />
          </button>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent-soft)]">
              {pageTitle(pathname)}
            </p>

            <h1 className="mt-1 text-xl font-black text-[var(--text-main)] sm:text-2xl">
              {user ? `Ciao, ${user.username}` : "Continua il tuo percorso"}
            </h1>
          </div>
        </div>

        <AccountMenu user={user} onLogout={onLogout} />
      </div>
    </header>
  )
}
