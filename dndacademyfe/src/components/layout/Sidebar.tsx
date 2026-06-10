"use client"

import Link from "next/link"
import {
  FiAward,
  FiBookOpen,
  FiGrid,
  FiLogOut,
  FiShield,
  FiUser,
  FiX,
} from "react-icons/fi"
import type { UserProfile } from "@/types/user"
import { usePathname } from "next/navigation"

type SidebarProps = {
  user: UserProfile | null
  onLogout: () => void
  onClose?: () => void
  showCloseButton?: boolean
}

const navigationItems = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: FiGrid,
  },
  {
    label: "Lezioni",
    href: "/lessons",
    icon: FiBookOpen,
  },
  {
    label: "Campagne",
    href: "/campaigns",
    icon: FiShield,
  },
  {
    label: "Badge",
    href: "/achievements",
    icon: FiAward,
  },
  {
    label: "Profilo",
    href: "/profile",
    icon: FiUser,
  },
]

export default function Sidebar({
  user,
  onLogout,
  onClose,
  showCloseButton = false,
}: SidebarProps) {
  const learningLevel = user?.learningLevel ?? "BEGINNER"
  const pathname = usePathname()
  return (
    <aside className="sticky top-0 h-screen w-72 border-r border-[var(--border-teal-soft)] bg-[var(--bg-sidebar)]">
      <div className="flex h-full flex-col p-5">
        <div className="mb-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.35em] text-[var(--accent-soft)]">
              D&D Academy
            </p>

            <h2 className="mt-2 text-xl font-black text-[var(--text-main)]">
              Player Hub
            </h2>
          </div>

          {showCloseButton && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-[var(--text-soft)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-main)] lg:hidden"
              aria-label="Chiudi menu di navigazione"
            >
              <FiX size={22} aria-hidden="true" />
            </button>
          )}
        </div>

        <nav aria-label="Navigazione principale" className="flex-1">
          <ul className="space-y-2">
            {navigationItems.map((item) => {
              const Icon = item.icon
              const isActive =
                pathname === item.href || pathname.startsWith(`${item.href}/`)

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={[
                      "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition",
                      isActive
                        ? "bg-[var(--surface-soft)] text-[var(--accent-soft)] shadow-[var(--shadow-glow)]"
                        : "text-[var(--text-soft)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-main)]",
                    ].join(" ")}
                  >
                    <Icon size={20} aria-hidden="true" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="rounded-2xl border border-[var(--border-gold)]/50 bg-[rgba(245,158,11,0.12)] p-4">
          <p className="text-sm font-bold text-[var(--text-main)]">
            Livello attuale:
          </p>

          <p className="mt-1 text-lg font-black text-[var(--accent-soft)]">
            {learningLevel}
          </p>

          <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div
              className={[
                "h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]",
                learningLevel === "BEGINNER" && "w-1/3",
                learningLevel === "INTERMEDIATE" && "w-2/3",
                learningLevel === "ADVANCED" && "w-full",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          </div>

          <p className="mt-2 text-xs font-bold text-[var(--text-muted)]">
            Avanza completando lezioni e quiz.
          </p>
        </div>

        <button
          type="button"
          onClick={onLogout}
          className="mt-4 flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-[var(--text-muted)] transition hover:bg-[var(--surface-soft)] hover:text-[var(--text-main)]"
        >
          <FiLogOut size={20} aria-hidden="true" />
          Logout
        </button>
      </div>
    </aside>
  )
}
