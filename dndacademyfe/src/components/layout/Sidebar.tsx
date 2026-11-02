"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { FiAward, FiBookOpen, FiGrid, FiShield, FiX, FiUsers, FiCrosshair, FiHelpCircle, FiSettings } from "react-icons/fi"
import type { UserProfile } from "@/types/user"
import { useNavigation } from "@/hooks/useNavigation"
import { learningLevelLabels, learningLevelStages } from "@/lib/learning-level"

type SidebarProps = { user: UserProfile | null; onClose?: () => void; showCloseButton?: boolean; activeHref?: string }
const playerGroups = [
  { title: "Percorso", items: [{ label: "Il tuo percorso", href: "/dashboard", icon: FiGrid }, { label: "Campagne", href: "/campaigns", icon: FiShield }, { label: "Biblioteca lezioni", href: "/lessons", icon: FiBookOpen }] },
  { title: "La tua avventura", items: [{ label: "I tuoi personaggi", href: "/characters", icon: FiUsers }, { label: "Storico combattimenti", href: "/combat", icon: FiCrosshair }] },
  { title: "Traguardi", items: [{ label: "Badge", href: "/achievements", icon: FiAward }] },
]
const masterGroups = [
  { title: "Gestione", items: [{ label: "Area Master", href: "/admin", icon: FiGrid }, { label: "Campagne", href: "/admin/campaigns", icon: FiShield }] },
  { title: "Didattica", items: [{ label: "Lezioni", href: "/admin/lessons", icon: FiBookOpen }, { label: "Quiz", href: "/admin/quizzes", icon: FiHelpCircle }] },
  { title: "Risorse", items: [{ label: "Personaggi", href: "/admin/characters", icon: FiUsers }, { label: "PNG", href: "/admin/npcs", icon: FiUsers }, { label: "Badge", href: "/admin/badges", icon: FiAward }] },
  { title: "Amministrazione", items: [{ label: "Utenti", href: "/admin/users", icon: FiSettings }] },
]

export default function Sidebar({ user, onClose, showCloseButton = false, activeHref }: SidebarProps) {
  const pathname = usePathname()
  const { area, rememberArea } = useNavigation()
  const currentPath = activeHref ?? pathname
  const groups = area === "master" ? masterGroups : playerGroups
  const learningLevel = user?.learningLevel ?? "BEGINNER"
  const level = learningLevelLabels[learningLevel]
  const stage = learningLevelStages[learningLevel]
  const navigate = () => { rememberArea(area); onClose?.() }
  return <aside className="sticky top-0 h-dvh w-72 shrink-0 border-r border-[var(--border-teal-soft)] bg-[var(--bg-sidebar)]">
    <div className="flex h-full flex-col p-4">
      <div className="mb-4 flex items-start justify-between gap-3 px-2">
        <div><p className="text-xs font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">D&D Academy</p><h2 className="mt-2 text-xl font-black">{area === "master" ? "Area Master" : "Area Player"}</h2></div>
        {showCloseButton && <button type="button" onClick={onClose} aria-label="Chiudi menu di navigazione" className="rounded-xl p-2 lg:hidden"><FiX size={22} aria-hidden="true" /></button>}
      </div>
      {user?.role === "MASTER" && <nav aria-label="Scegli area" className="mb-4 grid grid-cols-2 gap-1 rounded-xl bg-[var(--surface-muted)] p-1">
        {(["player", "master"] as const).map(value => <Link key={value} href={value === "master" ? "/admin" : "/dashboard"} onClick={() => { rememberArea(value); onClose?.() }} aria-current={area === value ? "true" : undefined} className={`rounded-lg px-2 py-2 text-center text-sm font-bold ${area === value ? "bg-[var(--surface)] text-[var(--accent-soft)]" : "text-[var(--text-soft)]"}`}>{value === "master" ? "Area Master" : "Area Player"}</Link>)}
      </nav>}
      <nav aria-label="Navigazione principale" className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain pr-1">
        {groups.map(group => <div key={group.title}><p className="mb-1 px-3 text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">{group.title}</p><ul className="space-y-1">
          {group.items.map(item => {
            const active = item.href === "/admin" ? currentPath === item.href : currentPath === item.href || currentPath.startsWith(`${item.href}/`)
            const Icon = item.icon
            return <li key={item.href}><Link href={item.href} onClick={navigate} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${active ? "bg-[var(--surface-soft)] text-[var(--accent-soft)]" : "text-[var(--text-soft)] hover:bg-[var(--surface-soft)]"}`}><Icon size={19} aria-hidden="true" />{item.label}</Link></li>
          })}
        </ul></div>)}
      </nav>
      <div className="mt-4 shrink-0 rounded-2xl border border-[var(--border-gold)]/50 bg-[rgba(245,158,11,0.12)] p-4">
        <p className="text-sm font-bold text-[var(--text-main)]">Livello attuale:</p>
        <p className="mt-1 text-lg font-black text-[var(--accent-soft)]">{level}</p>
        <div role="progressbar" aria-label="Livello di apprendimento" aria-valuemin={1} aria-valuemax={3} aria-valuenow={stage} aria-valuetext={`${level}, livello ${stage} di 3`} className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
          <div className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] transition-[width] motion-reduce:transition-none" style={{ width: `${stage / 3 * 100}%` }} />
        </div>
        <p className="mt-2 text-xs font-bold text-[var(--text-muted)]">Avanza completando lezioni e quiz.</p>
      </div>
    </div>
  </aside>
}
