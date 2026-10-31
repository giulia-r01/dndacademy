"use client"

import { useEffect, useState } from "react"
import { FiAward, FiLock } from "react-icons/fi"
import AppShell from "@/components/layout/AppShell"
import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import StatCard from "@/components/dashboard/StatCard"
import { badgeService } from "@/services/badge.service"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import type { UserBadge } from "@/types/badge"

export default function AchievementsPage() {
  const { user } = useCurrentUser()
  const [badges, setBadges] = useState<UserBadge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [attempt, setAttempt] = useState(0)
  const [filter, setFilter] = useState("all")
  const [search, setSearch] = useState("")
  useEffect(() => {
    if (!user?.id) return
    let active = true
    badgeService.getCatalog().then((result) => { if (active) setBadges(result) })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Impossibile caricare i badge.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user?.id, attempt])
  const unlocked = badges.filter((badge) => badge.unlocked).length
  const visible = badges.filter((badge) => (filter === "all" || (filter === "unlocked" ? badge.unlocked : !badge.unlocked)) &&
    `${badge.name} ${badge.description}`.toLocaleLowerCase("it").includes(search.trim().toLocaleLowerCase("it")))
    .sort((a, b) => Number(b.unlocked) - Number(a.unlocked) || a.name.localeCompare(b.name, "it"))
  return <AppShell><section className="space-y-6">
    <div><h2 className="text-3xl font-black">I tuoi badge</h2><p className="mt-2 text-[var(--text-soft)]">Riscopri i traguardi raggiunti e quelli che ti aspettano.</p></div>
    {loading ? <AppCard><p role="status">Caricamento badge...</p></AppCard> : error ? <AppCard>
      <p role="alert" className="text-[var(--danger)]">{error}</p>
      <AppButton className="mt-4" onClick={() => { setError(""); setLoading(true); setAttempt((value) => value + 1) }}>Riprova</AppButton>
    </AppCard> : <>
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard title="Badge ottenuti" value={String(unlocked)} icon={<FiAward aria-hidden="true" size={22} />} />
        <StatCard title="Da sbloccare" value={String(badges.length - unlocked)} icon={<FiLock aria-hidden="true" size={22} />} />
        <StatCard title="Collezione" value={`${badges.length ? Math.round(unlocked / badges.length * 100) : 0}%`} icon={<FiAward aria-hidden="true" size={22} />} />
      </div>
      {badges.length === 0 ? <AppCard><p>Non ci sono ancora badge disponibili. Torna a trovarci per i prossimi traguardi.</p></AppCard> : <>
        <AppCard className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 text-sm font-bold">Cerca badge<input type="search" value={search} onChange={(event) => setSearch(event.target.value)} className="block w-full rounded-xl bg-[var(--surface-muted)] px-4 py-3" placeholder="Nome o descrizione" /></label>
          <label className="space-y-2 text-sm font-bold">Stato<select value={filter} onChange={(event) => setFilter(event.target.value)} className="block w-full rounded-xl bg-[var(--surface-muted)] px-4 py-3"><option value="all">Tutti i badge</option><option value="unlocked">Ottenuti</option><option value="locked">Da sbloccare</option></select></label>
        </AppCard>
        {unlocked === 0 && <p className="text-[var(--text-soft)]">Non hai ancora ottenuto badge. Completa lezioni, quiz e capitoli per iniziare la collezione.</p>}
        {visible.length === 0 ? <AppCard><p>Nessun badge corrisponde ai filtri selezionati.</p></AppCard> : <div className="grid gap-4 md:grid-cols-2">
          {visible.map((badge) => <AppCard key={badge.id} className={badge.unlocked ? "border-[var(--border-gold)]" : ""}>
            <div className="flex items-start gap-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${badge.unlocked ? "bg-[var(--accent)] text-[var(--bg-app-deep)]" : "bg-[var(--surface-muted)] text-[var(--text-muted)]"}`}>{badge.unlocked ? <FiAward size={24} aria-hidden="true" /> : <FiLock size={24} aria-hidden="true" />}</div>
              <div className="min-w-0"><h3 className="break-words text-lg font-black">{badge.name}</h3><p className="mt-2 break-words text-sm text-[var(--text-soft)]">{badge.description}</p>
                <p className="mt-3 text-sm font-bold text-[var(--accent-soft)]">{badge.unlocked ? "Ottenuto" : "Da sbloccare"}</p>
                {badge.unlockedAt && <p className="mt-1 text-sm text-[var(--text-muted)]">Sbloccato il <time dateTime={badge.unlockedAt}>{new Date(badge.unlockedAt).toLocaleDateString("it-IT")}</time></p>}
              </div>
            </div>
          </AppCard>)}
        </div>}
      </>}
    </>}
  </section></AppShell>
}
