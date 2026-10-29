"use client"

import { useEffect, useState } from "react"
import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import EntityPortrait from "@/components/common/EntityPortrait"
import CombatHistoryDetails from "@/components/combat/CombatHistoryDetails"
import { combatService } from "@/services/combat.service"
import type { CombatHistoryEntry, CombatHistoryPage } from "@/types/combat"

export function combatOutcomeLabel(combat: Pick<CombatHistoryEntry, "completed" | "outcome">) {
  if (!combat.completed) return "Non concluso"
  return combat.outcome === "PLAYER_VICTORY" ? "Vittoria" : combat.outcome === "ENEMY_VICTORY" ? "Sconfitta" : "Concluso"
}

function finishedDate(value: string | null) {
  if (!value) return "Data non disponibile"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Data non disponibile" : new Intl.DateTimeFormat("it-IT", { dateStyle: "medium", timeStyle: "short" }).format(date)
}

export default function CombatHistory() {
  const [page, setPage] = useState(0)
  const [reload, setReload] = useState(0)
  const [expanded, setExpanded] = useState(false)
  return <div className="space-y-5">
    <AppCard className="flex flex-wrap items-center justify-between gap-4">
      <p className="max-w-2xl text-sm text-[var(--text-soft)]">Apri un incontro dal capitolo della campagna per entrare nell&apos;arena con il tuo personaggio e i nemici.</p>
      <AppButton href="/campaigns" variant="secondary">Vai alle campagne</AppButton>
    </AppCard>
    <details className="rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface)]" onToggle={event => setExpanded(event.currentTarget.open)}>
      <summary className="cursor-pointer rounded-2xl p-5 font-bold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">Storico dei combattimenti</summary>
      {expanded && <div className="border-t border-[var(--border-teal-soft)] p-4 sm:p-5"><HistoryPage key={`${page}-${reload}`} page={page} onPage={setPage} onRetry={() => setReload(value => value + 1)} /></div>}
    </details>
  </div>
}

function HistoryPage({ page, onPage, onRetry }: { page: number; onPage: (page: number) => void; onRetry: () => void }) {
  const [history, setHistory] = useState<CombatHistoryPage | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [selected, setSelected] = useState<CombatHistoryEntry | null>(null)
  useEffect(() => {
    let active = true
    combatService.getHistory(page).then(data => { if (active) setHistory(data) })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Impossibile caricare i combattimenti") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [page])

  return <section aria-label="Storico dei combattimenti" className="space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-[var(--text-soft)]">{history ? `${history.totalElements} ${history.totalElements === 1 ? "scontro salvato" : "scontri salvati"}` : "Il tuo percorso in battaglia"}</p>
    </div>
    {loading && <AppCard><p role="status">Caricamento dei tuoi combattimenti...</p></AppCard>}
    {error && <AppCard><p role="alert" className="text-[var(--danger)]">{error}</p><AppButton type="button" className="mt-3" onClick={onRetry}>Riprova</AppButton></AppCard>}
    {!loading && !error && history && <>
      {history.items.some(combat => !combat.completed) && <p className="text-sm text-[var(--text-soft)]">Ogni tentativo ha un proprio risultato. “Non concluso” indica un tentativo senza esito finale salvato, anche precedente a uno scontro già terminato: non modifica le vittorie o le sconfitte degli altri tentativi.</p>}
      {history.items.length === 0 ? <AppCard className="py-10 text-center"><h3 className="text-xl font-black">Il tuo diario di battaglia inizia qui</h3><p className="mx-auto mt-3 max-w-xl text-[var(--text-soft)]">Non hai ancora combattimenti salvati. Entra in una campagna e affronta uno scontro: qui ritroverai il personaggio, il capitolo e il risultato.</p></AppCard> :
        <div className="grid gap-4 xl:grid-cols-2">{history.items.map(combat => <AppCard key={combat.combatId} role="article" aria-label={`Combattimento ${combat.combatId}`}>
          <div className="flex flex-col gap-4 sm:flex-row">
            <EntityPortrait name={combat.characterName ?? "Personaggio"} imageUrl={combat.characterImageUrl} className="h-[180px] w-full shrink-0 sm:w-[120px]" />
            <div className="min-w-0 flex-1 space-y-3">
              <div className="flex flex-wrap items-center gap-2"><span className={`rounded-full border px-3 py-1 text-xs font-bold ${!combat.completed ? "border-amber-400/40 bg-amber-400/10 text-amber-200" : combat.outcome === "PLAYER_VICTORY" ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : combat.outcome === "ENEMY_VICTORY" ? "border-red-500/40 bg-red-500/10 text-red-300" : "border-[var(--border-teal-soft)]"}`}>{combatOutcomeLabel(combat)}</span><span className="text-xs text-[var(--text-muted)]">Scontro #{combat.combatId}</span></div>
              <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-soft)]">{combat.campaignName}</p><h3 className="mt-1 break-words text-lg font-black">{combat.encounterTitle}</h3><p className="mt-1 text-sm text-[var(--text-soft)]">{combat.chapterTitle}</p></div>
              <div className="text-sm"><p className="font-bold">{combat.characterName ?? "Personaggio non disponibile"}</p>{combat.characterCurrentHp !== null && combat.characterMaxHp !== null && <p className="text-[var(--text-muted)]">HP salvati: {combat.characterCurrentHp}/{combat.characterMaxHp}</p>}</div>
              <p className="text-xs text-[var(--text-muted)]">{combat.completed ? `Concluso: ${finishedDate(combat.completedAt)}` : "Nessun esito finale salvato per questo tentativo"}</p>
              <AppButton type="button" variant="secondary" onClick={() => setSelected(combat)}>Vedi dettagli e registro</AppButton>
            </div>
          </div>
        </AppCard>)}</div>}
      {history.totalPages > 1 && <nav aria-label="Pagine dello storico" className="flex flex-wrap items-center justify-between gap-3"><AppButton type="button" variant="secondary" disabled={page === 0} onClick={() => onPage(page - 1)}>Precedenti</AppButton><p className="text-sm" aria-live="polite">Pagina {page + 1} di {history.totalPages}</p><AppButton type="button" variant="secondary" disabled={page + 1 >= history.totalPages} onClick={() => onPage(page + 1)}>Successivi</AppButton></nav>}
    </>}
    {selected && <CombatHistoryDetails key={selected.combatId} combat={selected} onClose={() => setSelected(null)} />}
  </section>
}
