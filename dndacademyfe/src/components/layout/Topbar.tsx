"use client"

import { FiBell, FiMenu, FiUser } from "react-icons/fi"
import type { UserProfile } from "@/types/user"

type TopbarProps = {
  onMenuClick: () => void
  user: UserProfile | null
}

export default function Topbar({ onMenuClick, user }: TopbarProps) {
  const username = user?.username ?? "Avventuriero"
  const learningLevel = user?.learningLevel ?? "BEGINNER"
  const avatarLetter = username.charAt(0).toUpperCase()
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
              Dashboard
            </p>

            <h1 className="mt-1 text-xl font-black text-[var(--text-main)] sm:text-2xl">
              {user ? `Ciao, ${user.username}` : "Continua il tuo percorso"}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="relative rounded-xl p-2 text-[var(--text-soft)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-main)]"
            aria-label="Notifiche"
          >
            <FiBell size={20} aria-hidden="true" />
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-[var(--accent)]" />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface)] px-3 py-2">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-sm font-black text-white"
              aria-hidden="true"
            >
              {avatarLetter}
            </div>

            <div className="hidden text-sm sm:block">
              <p className="font-bold text-[var(--text-main)]">{username}</p>
              <p className="text-[var(--text-muted)]">{learningLevel}</p>
            </div>

            <FiUser
              className="hidden text-[var(--text-soft)] sm:block"
              size={18}
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
    </header>
  )
}
