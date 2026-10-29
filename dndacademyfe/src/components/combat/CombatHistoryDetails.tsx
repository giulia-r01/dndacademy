"use client"

import { useEffect, useState } from "react"
import AppModal from "@/components/common/AppModal"
import EntityPortrait from "@/components/common/EntityPortrait"
import { combatService } from "@/services/combat.service"
import type { CombatHistoryEntry, CombatStatus } from "@/types/combat"

export default function CombatHistoryDetails({ combat, onClose }: { combat: CombatHistoryEntry; onClose: () => void }) {
  const [status, setStatus] = useState<CombatStatus | null>(null)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(true)
  const [retry, setRetry] = useState(0)
  useEffect(() => {
    let active = true
    combatService.getStatus(combat.combatId).then(data => { if (active) setStatus(data) })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Impossibile leggere il registro") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [combat.combatId, retry])
  function name(id: number, fallback: string) {
    const fighter = status?.fighters.find(item => item.participantId === id)
    if (!fighter || !status) return fallback
    const matches = status.fighters.filter(item => item.name === fighter.name)
    return matches.length > 1 ? `${fighter.name} ${matches.findIndex(item => item.participantId === id) + 1}` : fighter.name
  }
  return <AppModal isOpen title={combat.encounterTitle} description={`${combat.campaignName} · ${combat.chapterTitle}`} onClose={onClose} size="xl">
    {loading && <p role="status">Caricamento del registro...</p>}
    {error && <div><p role="alert" className="text-[var(--danger)]">{error}</p><button type="button" className="mt-3 rounded-xl border border-[var(--border-teal-soft)] px-4 py-3 font-bold" onClick={() => { setLoading(true); setError(""); setRetry(value => value + 1) }}>Riprova</button></div>}
    {!loading && !error && status && <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xl font-black">{!status.completed ? "Non concluso" : status.outcome === "PLAYER_VICTORY" ? "Vittoria" : status.outcome === "ENEMY_VICTORY" ? "Sconfitta" : "Concluso"}</p><p className="text-sm text-[var(--text-muted)]">Riepilogo di sola lettura</p></div>
      <section aria-label="Partecipanti al combattimento" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{status.fighters.map(fighter => <article key={fighter.participantId} className="flex gap-3 rounded-xl bg-[var(--surface-muted)] p-3">
        <EntityPortrait name={name(fighter.participantId, fighter.name)} imageUrl={fighter.imageUrl} className="h-[100px] w-[70px] shrink-0" />
        <div className="min-w-0"><p className="break-words font-bold">{name(fighter.participantId, fighter.name)}</p><p className="mt-1 text-xs text-[var(--text-muted)]">{fighter.characterId !== null ? "Il tuo personaggio" : fighter.enemy ? "Nemico" : "Aiutante"}</p><p className="mt-2 text-sm font-bold">HP {fighter.currentHp}/{fighter.maxHp}{!fighter.alive ? " · Sconfitto" : ""}</p></div>
      </article>)}</section>
      <section aria-label="Registro dello scontro"><h3 className="text-lg font-black">Registro · {status.events.length} {status.events.length === 1 ? "azione" : "azioni"}</h3>
        {status.events.length === 0 ? <p className="mt-3 text-sm text-[var(--text-soft)]">Non ci sono azioni registrate per questo scontro. I combattimenti più vecchi possono non avere un registro disponibile.</p> :
          <ol className="mt-3 space-y-2">{status.events.map((event, index) => <li key={index} className="rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] p-3 text-sm"><p className="font-bold">{index + 1}. {name(event.attackerId, event.attackerName)} → {name(event.targetId, event.targetName)}</p><p className="mt-1">{event.critical ? "Critico! " : ""}{event.hit ? `${event.damage} danni` : "Mancato: nessun danno"} · HP {event.targetHpBefore} → {event.targetRemainingHp}</p><p className="mt-1 text-xs text-[var(--text-muted)]">d20 {event.attackRoll} · Totale {event.totalAttack} · CA {event.targetArmorClass}</p></li>)}</ol>}
      </section>
    </div>}
  </AppModal>
}
