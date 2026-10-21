"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"

import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import AppShell from "@/components/layout/AppShell"
import AttackResultCard from "@/components/combat/AttackResultCard"
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
  const availableTargets =
    status?.fighters.filter((fighter) => fighter.alive && fighter.enemy) ?? []

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
    } finally {
      setIsBusy(false)
    }
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          {campaignId !== null && chapterId !== null && (
            <Link
              href={`/campaigns/${campaignId}/chapters/${chapterId}`}
              className="text-sm font-bold text-[var(--accent-soft)] hover:underline"
            >
              ← Torna al capitolo
            </Link>
          )}
          <h2 className="mt-3 text-3xl font-black text-[var(--text-main)]">
            Combattimento narrativo
          </h2>
          <p className="mt-2 text-[var(--text-soft)]">
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
            <AppButton type="button" onClick={startCombat} disabled={isBusy}>
              {isBusy ? "Avvio in corso..." : "Inizia il combattimento"}
            </AppButton>
          </AppCard>
        ) : (
          status && (
            <>
              <AppCard>
                <h3 className="text-xl font-black text-[var(--text-main)]">
                  {status.completed
                    ? "Combattimento concluso"
                    : "Turno corrente"}
                </h3>
                <p className="mt-2 text-[var(--text-soft)]" aria-live="polite">
                  {status.completed
                    ? status.outcome === "PLAYER_VICTORY"
                      ? "Vittoria! Torna al capitolo per completarlo e ottenere la ricompensa."
                      : "Sconfitta. Potrai tentare un nuovo combattimento."
                    : `Tocca a ${currentFighter?.name ?? "..."}`}
                </p>
                {status.completed && status.outcome === "ENEMY_VICTORY" && (
                  <div className="mt-4">
                    <AppButton
                      type="button"
                      disabled={isBusy}
                      onClick={startCombat}
                    >
                      Riprova
                    </AppButton>
                  </div>
                )}
              </AppCard>

              <AppCard>
                <h3 className="text-lg font-black text-[var(--text-main)]">
                  Ordine di iniziativa
                </h3>
                <div className="mt-4 space-y-3">
                  {status.fighters.map((fighter) => (
                    <div
                      key={fighter.participantId}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--surface-muted)] px-4 py-3"
                    >
                      <div>
                        <p className="font-bold text-[var(--text-main)]">
                          {fighter.name}
                          {fighter.enemy ? " (nemico)" : " (alleato)"}
                          {fighter.currentTurn && !status.completed
                            ? " · In turno"
                            : ""}
                        </p>
                        <p className="text-sm text-[var(--text-soft)]">
                          Iniziativa: {fighter.initiative} · CA:{" "}
                          {fighter.armorClass}
                        </p>
                      </div>
                      <p className="font-bold text-[var(--text-main)]">
                        HP {fighter.currentHp}/{fighter.maxHp}
                        {!fighter.alive ? " · Sconfitto" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </AppCard>

              {playerCanAct && currentFighter && (
                <AppCard>
                  <h3 className="text-xl font-black text-[var(--text-main)]">
                    Attacco di {currentFighter.name}
                  </h3>
                  <div className="mt-4 space-y-4">
                    <div>
                      <p className="mb-2 text-sm font-bold text-[var(--text-main)]">
                        Azione
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <AppButton
                          type="button"
                          variant={
                            actionType === "WEAPON" ? "primary" : "secondary"
                          }
                          onClick={() => setActionType("WEAPON")}
                        >
                          Arma: {currentFighter.weaponName} · d
                          {currentFighter.damageDie}
                        </AppButton>
                        {currentFighter.spellcaster && (
                          <AppButton
                            type="button"
                            variant={
                              actionType === "SPELL" ? "primary" : "secondary"
                            }
                            onClick={() => setActionType("SPELL")}
                          >
                            Incantesimo: {currentFighter.spellName} · d
                            {currentFighter.spellDamageDie}
                          </AppButton>
                        )}
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="combat-target"
                        className="text-sm font-bold text-[var(--text-main)]"
                      >
                        Bersaglio
                      </label>
                      <select
                        id="combat-target"
                        className="mt-2 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)]"
                        value={selectedTargetId ?? ""}
                        onChange={(event) =>
                          setSelectedTargetId(
                            event.target.value
                              ? Number(event.target.value)
                              : null,
                          )
                        }
                      >
                        <option value="">Seleziona un nemico</option>
                        {availableTargets.map((fighter) => (
                          <option
                            key={fighter.participantId}
                            value={fighter.participantId}
                          >
                            {fighter.name} · HP {fighter.currentHp}/
                            {fighter.maxHp}
                          </option>
                        ))}
                      </select>
                    </div>
                    <AppButton
                      type="button"
                      disabled={isBusy || selectedTargetId === null}
                      onClick={handleAttack}
                    >
                      {isBusy ? "Attacco in corso..." : "Attacca"}
                    </AppButton>
                  </div>
                </AppCard>
              )}

              {attackResult && <AttackResultCard result={attackResult} />}
            </>
          )
        )}
      </section>
    </AppShell>
  )
}
