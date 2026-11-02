"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import AppShell from "@/components/layout/AppShell"
import CombatArena from "@/components/combat/CombatArena"
import CombatPreparation from "@/components/combat/CombatPreparation"
import { combatService } from "@/services/combat.service"
import type {
  AttackResult,
  CombatActionType,
  CombatStatus,
  CombatPreview,
} from "@/types/combat"

export default function ChapterCombat({ campaignId, chapterId, resumeCombatId = null }: { campaignId: number; chapterId: number; resumeCombatId?: number | null }) {
  const [preview, setPreview] = useState<CombatPreview | null>(null)
  const [combatId, setCombatId] = useState<number | null>(resumeCombatId)
  const [status, setStatus] = useState<CombatStatus | null>(null)
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<CombatActionType>("WEAPON")
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!resumeCombatId) return
    let active = true
    combatService.getStatus(resumeCombatId).then(updated => {
      if (updated.campaignId !== campaignId || updated.chapterId !== chapterId) throw new Error("Questo combattimento non appartiene al capitolo selezionato.")
      if (active) setStatus(updated)
    }).catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Impossibile riprendere il combattimento.") })
    return () => { active = false }
  }, [campaignId, chapterId, resumeCombatId])

  async function refreshCombatStatus(id: number) {
    const updated = await combatService.getStatus(id)
    if (updated.campaignId !== campaignId || updated.chapterId !== chapterId) throw new Error("Questo combattimento non appartiene al capitolo selezionato.")
    setStatus(updated)
  }

  async function startCombat() {
    if (chapterId === null || isBusy) return
    setIsBusy(true)
    setError("")
    setAttackResult(null)
    setSelectedTargetId(null)
    setActionType("WEAPON")
    try {
      const combat = await combatService.startChapter(chapterId)
      setCombatId(combat.id)
      await refreshCombatStatus(combat.id)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Impossibile avviare il combattimento",
      )
    } finally {
      setIsBusy(false)
    }
  }

  const currentFighter = status?.fighters.find(
    (fighter) => fighter.participantId === status.currentTurnParticipantId,
  )
  const playerCanAct = Boolean(
    status &&
    !status.completed &&
    currentFighter?.alive &&
    !currentFighter.enemy &&
    currentFighter.characterId !== null,
  )
  const npcCanAct = Boolean(status && !status.completed && currentFighter?.npcId != null && currentFighter.alive)

  async function handleNpcTurn() {
    if (!combatId || !status || isBusy || !npcCanAct) return
    setIsBusy(true)
    setError("")
    setAttackResult(null)
    try {
      setStatus(await combatService.advanceNpcTurn(combatId, status.events.length))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossibile mostrare l'azione")
      // Recover the authoritative state without repeating the action after a network failure.
      try { await refreshCombatStatus(combatId) } catch { /* Keep the original error visible. */ }
    } finally { setIsBusy(false) }
  }

  async function handleAttack() {
    if (
      isBusy ||
      !playerCanAct ||
      !currentFighter ||
      !combatId ||
      selectedTargetId === null
    )
      return
    setIsBusy(true)
    setError("")
    try {
      const result = await combatService.attack({
        combatId,
        attackerId: currentFighter.participantId,
        targetId: selectedTargetId,
        actionType,
      })
      setAttackResult(result)
      setSelectedTargetId(null)
      setActionType("WEAPON")
      await refreshCombatStatus(combatId)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Errore durante l'attacco")
      try { await refreshCombatStatus(combatId) } catch { /* Keep the original error visible. */ }
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <AppShell breadcrumbs={[{ label: "Campagne", href: "/campaigns" }, { label: preview?.campaignName ?? "Campagna", href: `/campaigns/${campaignId}` }, { label: preview?.chapterTitle ?? "Capitolo", href: `/campaigns/${campaignId}/chapters/${chapterId}` }, { label: "Combattimento" }]}>
      <section className="mx-auto max-w-[1440px] space-y-4">
        <div>
          {campaignId !== null && chapterId !== null && (
            <Link
              href={`/campaigns/${campaignId}/chapters/${chapterId}`}
              aria-label="Torna al capitolo"
              className="text-sm font-bold text-[var(--accent-soft)] hover:underline"
            >
              ← Torna al capitolo
            </Link>
          )}
          <h2 className="mt-3 text-2xl font-black sm:text-3xl text-[var(--text-main)]">
            Combattimento narrativo
          </h2>
          <p className={`mt-2 text-[var(--text-soft)] ${status ? "hidden sm:block" : ""}`}>
            Affronta i nemici del capitolo con il personaggio che hai scelto.
          </p>
        </div>

        {status?.completed && <AppCard className="flex flex-wrap items-center justify-between gap-4"><p>{status.outcome === "PLAYER_VICTORY" ? "Hai vinto! Torna al capitolo per proseguire il percorso." : "Il combattimento è concluso. Puoi riprovare o tornare al capitolo."}</p><AppButton href={`/campaigns/${campaignId}/chapters/${chapterId}`}>Torna al capitolo e prosegui</AppButton></AppCard>}
        {error && (
          <AppCard>
            <p role="alert" className="text-[var(--danger)]">
              {error}
            </p>
          </AppCard>
        )}

        {combatId === null ? (
          campaignId !== null
            ? <CombatPreparation key={`${campaignId}-${chapterId}`} campaignId={campaignId} chapterId={chapterId} isBusy={isBusy} onStart={startCombat} onPreviewLoaded={setPreview} />
            : <AppCard>Apri il combattimento dal capitolo della campagna.</AppCard>
        ) : status ? (
          <CombatArena key={status.combatId} status={status} attackResult={attackResult} selectedTargetId={selectedTargetId}
            actionType={actionType} isBusy={isBusy} onSelectTarget={setSelectedTargetId}
            onSelectAction={setActionType} onAttack={handleAttack} onNpcTurn={handleNpcTurn} onRestart={startCombat} />
        ) : (
          <AppCard><p role="status">Caricamento dello scontro...</p><AppButton type="button" disabled={isBusy} onClick={() => refreshCombatStatus(combatId).catch(err => setError(err instanceof Error ? err.message : "Impossibile recuperare lo stato"))}>Ricarica stato</AppButton></AppCard>
        )}
      </section>
    </AppShell>
  )
}
