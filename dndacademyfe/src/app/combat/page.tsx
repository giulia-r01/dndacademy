"use client"

import { Suspense, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { useSearchParams } from "next/navigation"

import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import AppShell from "@/components/layout/AppShell"
import AttackResultCard from "@/components/combat/AttackResultCard"
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
  const availableTargets =
    status?.fighters.filter((fighter) => fighter.alive && fighter.enemy) ?? []

  const latestEvent = status?.events?.at(-1)
  const player = status?.fighters.find(fighter => fighter.characterId !== null)
  const npcCanAct = Boolean(status && !status.completed && currentFighter?.npcId != null && currentFighter.alive)
  function fighterName(id: number, fallback: string) {
    const matches = status?.fighters.filter(fighter => fighter.name === fallback) ?? []
    return matches.length > 1 ? `${fallback} ${matches.findIndex(fighter => fighter.participantId === id) + 1}` : fallback
  }
  const currentName = currentFighter ? fighterName(currentFighter.participantId, currentFighter.name) : "..."

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
            {campaignId !== null
              ? <CombatPreparation key={campaignId} campaignId={campaignId} isBusy={isBusy} onStart={startCombat} />
              : <p>Apri il combattimento dal capitolo della campagna per scegliere il tuo personaggio.</p>}
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
                    : playerCanAct ? `È il tuo turno: ${currentFighter?.name}. Scegli un bersaglio e attacca.`
                    : `Turno di ${currentName} (${currentFighter?.enemy ? "nemico" : "aiutante"}). Il tuo personaggio attende.`}
                </p>
                {npcCanAct && (
                  <div className="mt-4 space-y-3">
                    <p className="text-sm text-[var(--text-soft)]">Prosegui per vedere il suo attacco. Bersaglio e danni vengono decisi dal combattimento.</p>
                    <AppButton type="button" disabled={isBusy} onClick={handleNpcTurn}>
                      {isBusy ? "Azione in corso..." : `Mostra l'azione di ${currentName}`}
                    </AppButton>
                  </div>
                )}
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

              {latestEvent && (
                <AppCard className={latestEvent.targetId === player?.participantId && latestEvent.hit ? "border-red-500 bg-red-500/10" : "border-[var(--border-gold)]"}>
                  <div role="status" aria-live="polite" aria-atomic="true" key={status.events.length}>
                    <h3 className="text-xl font-black">
                      {latestEvent.targetId === player?.participantId
                        ? latestEvent.hit ? `Sei stato colpito! −${latestEvent.damage} HP` : "Hai evitato l'attacco!"
                        : latestEvent.hit ? "Colpo a segno!" : "Attacco mancato"}
                    </h3>
                    <p className="mt-2">{fighterName(latestEvent.attackerId, latestEvent.attackerName)} → {fighterName(latestEvent.targetId, latestEvent.targetName)} · {latestEvent.critical ? "Critico! " : ""}{latestEvent.hit ? `${latestEvent.damage} danni` : "Nessun danno"}</p>
                    <p className="mt-2 font-bold">HP di {fighterName(latestEvent.targetId, latestEvent.targetName)}: {latestEvent.targetHpBefore} → {latestEvent.targetRemainingHp}{latestEvent.targetRemainingHp === 0 ? " · Sconfitto" : ""}</p>
                  </div>
                </AppCard>
              )}
              <AppCard>
                <h3 className="text-lg font-black text-[var(--text-main)]">
                  Ordine di iniziativa
                </h3>
                <div className="mt-4 space-y-3">
                  {status.fighters.map((fighter) => (
                    <div
                      key={fighter.participantId}
                      className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 ${fighter.currentTurn && !status.completed ? "border-amber-400 bg-amber-400/10" : latestEvent?.targetId === fighter.participantId && latestEvent.hit ? "border-red-500 bg-red-500/10" : "border-transparent bg-[var(--surface-muted)]"}`}
                    >
                      <div className="flex items-center gap-3">
                        {fighter.imageUrl
                          ? <Image unoptimized src={fighter.imageUrl} alt={fighter.name} width={64} height={64} className="h-16 w-16 rounded-xl object-cover" />
                          : <span aria-hidden="true" className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-2xl font-black">{fighter.name.slice(0, 1)}</span>}
                        <div>
                        <p className="font-bold text-[var(--text-main)]">
                          {fighterName(fighter.participantId, fighter.name)}
                          {fighter.characterId !== null ? " (tu)" : fighter.enemy ? " (nemico)" : " (aiutante)"}
                          {fighter.currentTurn && !status.completed
                            ? " · In turno"
                            : ""}
                        </p>
                        <p className="text-sm text-[var(--text-soft)]">
                          Iniziativa: {fighter.initiative} · CA:{" "}
                          {fighter.armorClass}
                        </p>
                        </div>
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
                            {fighterName(fighter.participantId, fighter.name)} · HP {fighter.currentHp}/
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
              {status.events.length > 0 && (
                <AppCard>
                  <h3 className="text-xl font-black">Registro del combattimento</h3>
                  <ol className="mt-4 max-h-96 space-y-3 overflow-y-auto" reversed>
                    {status.events.map((event, index) => ({ event, index })).reverse().map(({ event, index }) => (
                      <li key={index} className="rounded-xl bg-[var(--surface-muted)] p-3">
                        <p className="font-bold">{index + 1}. {fighterName(event.attackerId, event.attackerName)} → {fighterName(event.targetId, event.targetName)}</p>
                        <p>{event.critical ? "Critico! " : ""}{event.hit ? `Colpito: ${event.damage} danni.` : "Mancato: nessun danno."} HP {event.targetHpBefore} → {event.targetRemainingHp}</p>
                        <p className="text-sm text-[var(--text-soft)]">d20: {event.attackRoll} · Totale: {event.totalAttack} · CA: {event.targetArmorClass}</p>
                      </li>
                    ))}
                  </ol>
                </AppCard>
              )}
            </>
          )
        )}
      </section>
    </AppShell>
  )
}
