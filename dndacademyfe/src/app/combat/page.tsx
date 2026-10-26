"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

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
} from "@/types/combat"

export default function CombatPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <p className="text-[var(--text-soft)]">Caricamento combattimento...</p>
        </AppShell>
      }
    >
      <CombatContent />
    </Suspense>
  )
}

function CombatContent() {
  const params = useSearchParams()
  const chapter = Number(params.get("chapterId"))
  const campaign = Number(params.get("campaignId"))
  const chapterId = Number.isSafeInteger(chapter) && chapter > 0 ? chapter : null
  const campaignId = Number.isSafeInteger(campaign) && campaign > 0 ? campaign : null
  const [combatId, setCombatId] = useState<number | null>(null)
  const [status, setStatus] = useState<CombatStatus | null>(null)
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null)
  const [actionType, setActionType] = useState<CombatActionType>("WEAPON")
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null)
  const [isBusy, setIsBusy] = useState(false)
  const [error, setError] = useState("")

  async function refreshCombatStatus(id: number) {
    const updated = await combatService.getStatus(id)
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
    <AppShell>
      <section className="mx-auto max-w-[1440px] space-y-4">
        <div>
          {campaignId !== null && chapterId !== null && (
            <Link
              href={`/campaigns/${campaignId}/chapters/${chapterId}`}
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

        {error && (
          <AppCard>
            <p role="alert" className="text-[var(--danger)]">
              {error}
            </p>
          </AppCard>
        )}

        {chapterId === null ? (
          <AppCard>
            <p className="text-[var(--text-soft)]">
              Apri il combattimento dal capitolo di una campagna.
            </p>
            <Link
              href="/campaigns"
              className="mt-3 inline-block text-[var(--accent-soft)] underline"
            >
              Vai alle campagne
            </Link>
          </AppCard>
        ) : combatId === null ? (
          <AppCard>
            <p className="mb-4 text-[var(--text-soft)]">
              Capitolo {chapterId}. Il Master deve aver configurato almeno un
              incontro e un nemico.
            </p>
            {campaignId !== null
              ? <CombatPreparation key={campaignId} campaignId={campaignId} isBusy={isBusy} onStart={startCombat} />
              : <p>Apri il combattimento dal capitolo della campagna per scegliere il tuo personaggio.</p>}
          </AppCard>
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
