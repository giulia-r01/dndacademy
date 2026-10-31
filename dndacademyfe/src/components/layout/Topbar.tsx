"use client"

import { FiMenu, FiUser } from "react-icons/fi"
import type { UserProfile } from "@/types/user"
import Link from "next/link"
import UserAvatar from "@/components/common/UserAvatar"

type TopbarProps = {
  onMenuClick: () => void
  user: UserProfile | null
}

export default function Topbar({ onMenuClick, user }: TopbarProps) {
  const username = user?.username ?? "Avventuriero"
  const learningLevel = user?.learningLevel ?? "BEGINNER"
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
          <Link href="/profile" aria-label="Vai al tuo profilo" className="flex items-center gap-3 rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface)] px-3 py-2">
            <UserAvatar username={username} avatarUrl={user?.avatarUrl} />

            <div className="hidden text-sm sm:block">
              <p className="font-bold text-[var(--text-main)]">{username}</p>
              <p className="text-[var(--text-muted)]">{learningLevel}</p>
            </div>

            <FiUser
              className="hidden text-[var(--text-soft)] sm:block"
              size={18}
              aria-hidden="true"
            />
          </Link>
        </div>
      </div>
    </header>
  )
}
