"use client"

import { useEffect, useState } from "react"

import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import AppShell from "@/components/layout/AppShell"

import { campaignService } from "@/services/campaign.service"
import { combatService } from "@/services/combat.service"
import type {
  AttackRequest,
  AttackResult,
  CombatActionType,
  CombatStatus,
} from "@/types/combat"
import type { Campaign } from "@/types/campaign"
import AttackResultCard from "@/components/combat/AttackResultCard"

export default function CombatPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null,
  )

  const [combatId, setCombatId] = useState<number | null>(null)
  const [combatStatus, setCombatStatus] = useState<CombatStatus | null>(null)
  const [selectedTargetId, setSelectedTargetId] = useState<number | null>(null)
  const [selectedActionType, setSelectedActionType] =
    useState<CombatActionType>("WEAPON")
  const [isChangingTurn, setIsChangingTurn] = useState(false)
  const [isAttacking, setIsAttacking] = useState(false)
  const [attackResult, setAttackResult] = useState<AttackResult | null>(null)

  const [isLoading, setIsLoading] = useState(true)
  const [isStartingCombat, setIsStartingCombat] = useState(false)

  const [error, setError] = useState("")

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const data = await campaignService.getAll()

        setCampaigns(data)

        if (data.length === 1) {
          setSelectedCampaignId(data[0].id)
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento campagne"

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  async function refreshCombatStatus(id: number) {
    const status = await combatService.getStatus(id)
    setCombatStatus(status)
  }

  async function handleStartCombat() {
    if (!selectedCampaignId) {
      return
    }

    setError("")
    setAttackResult(null)
    setSelectedTargetId(null)
    setSelectedActionType("WEAPON")
    setIsStartingCombat(true)

    try {
      const combat = await combatService.start(selectedCampaignId)

      setCombatId(combat.id)
      await refreshCombatStatus(combat.id)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Errore nell'avvio del combattimento"

      setError(message)
    } finally {
      setIsStartingCombat(false)
    }
  }

  async function handleNextTurn() {
    if (!combatId) {
      return
    }

    setError("")
    setAttackResult(null)
    setSelectedTargetId(null)
    setSelectedActionType("WEAPON")
    setIsChangingTurn(true)

    try {
      await combatService.nextTurn(combatId)
      await refreshCombatStatus(combatId)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nel cambio turno"

      setError(message)
    } finally {
      setIsChangingTurn(false)
    }
  }

  const currentFighter = combatStatus?.fighters.find(
    (fighter) => fighter.characterId === combatStatus.currentTurnCharacterId,
  )

  const winnerFighter = combatStatus?.fighters.find(
    (fighter) => fighter.characterId === combatStatus.winnerCharacterId,
  )

  const availableActions: CombatActionType[] = currentFighter?.spellcaster
    ? ["WEAPON", "SPELL"]
    : ["WEAPON"]

  const availableTargets =
    combatStatus?.fighters.filter(
      (fighter) =>
        fighter.alive &&
        fighter.characterId !== combatStatus.currentTurnCharacterId,
    ) ?? []

  async function handleAttack() {
    if (!combatId || !combatStatus || !selectedTargetId) {
      return
    }

    setError("")
    setAttackResult(null)
    setIsAttacking(true)

    try {
      const attackPayload: AttackRequest = {
        combatId,
        attackerId: combatStatus.currentTurnCharacterId,
        targetId: selectedTargetId,
        actionType: selectedActionType,
      }

      const result = await combatService.attack(attackPayload)

      setAttackResult(result)
      setSelectedTargetId(null)
      setSelectedActionType("WEAPON")

      await refreshCombatStatus(combatId)

      await refreshCombatStatus(combatId)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore durante l'attacco"

      setError(message)
    } finally {
      setIsAttacking(false)
    }
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)]">
            Combat Training
          </h2>

          <p className="mt-2 max-w-2xl text-[var(--text-soft)]">
            Avvia un combattimento e osserva l&apos;ordine di iniziativa dei
            personaggi.
          </p>
        </div>

        {isLoading && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento campagne...</p>
          </AppCard>
        )}

        {error && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {error}
            </p>
          </AppCard>
        )}

        {!isLoading && (
          <>
            <AppCard>
              <label
                htmlFor="campaign"
                className="block text-sm font-bold text-[var(--text-main)]"
              >
                Campagna
              </label>

              <select
                id="campaign"
                value={selectedCampaignId ?? ""}
                onChange={(event) =>
                  setSelectedCampaignId(Number(event.target.value))
                }
                className="mt-3 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)]"
              >
                <option value="" disabled>
                  Seleziona una campagna
                </option>

                {campaigns.map((campaign) => (
                  <option key={campaign.id} value={campaign.id}>
                    {campaign.name}
                  </option>
                ))}
              </select>

              <div className="mt-5">
                <AppButton
                  type="button"
                  disabled={!selectedCampaignId || isStartingCombat}
                  onClick={handleStartCombat}
                >
                  {isStartingCombat
                    ? "Avvio combattimento..."
                    : "Avvia combattimento"}
                </AppButton>
              </div>
            </AppCard>

            {combatStatus && (
              <div className="space-y-5">
                <AppCard>
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--accent-soft)]">
                        Combattimento avviato
                      </p>

                      <h3 className="mt-2 text-2xl font-black text-[var(--text-main)]">
                        Turno corrente
                      </h3>

                      <p className="mt-2 text-[var(--text-soft)]">
                        Tocca a{" "}
                        <span className="font-bold text-[var(--accent-soft)]">
                          {currentFighter?.name ?? "personaggio sconosciuto"}
                        </span>
                      </p>
                    </div>

                    {!combatStatus.combatOver && (
                      <AppButton
                        type="button"
                        disabled={isChangingTurn}
                        onClick={handleNextTurn}
                      >
                        {isChangingTurn ? "Cambio turno..." : "Passa turno"}
                      </AppButton>
                    )}
                  </div>
                </AppCard>

                {!combatStatus.combatOver && currentFighter?.alive && (
                  <AppCard>
                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--accent-soft)]">
                          Azione
                        </p>

                        <h3 className="mt-2 text-2xl font-black text-[var(--text-main)]">
                          Attacco di {currentFighter.name}
                        </h3>

                        <div className="mt-5">
                          <p className="block text-sm font-bold text-[var(--text-main)]">
                            Tipo di azione
                          </p>

                          <div className="mt-2 grid gap-3 sm:grid-cols-2">
                            {availableActions.map((actionType) => {
                              const isSelected =
                                selectedActionType === actionType

                              const label =
                                actionType === "WEAPON"
                                  ? `Arma: ${currentFighter.weaponName} · d${currentFighter.damageDie}`
                                  : `Incantesimo: ${currentFighter.spellName} · d${currentFighter.spellDamageDie}`

                              return (
                                <button
                                  key={actionType}
                                  type="button"
                                  onClick={() =>
                                    setSelectedActionType(actionType)
                                  }
                                  className={[
                                    "rounded-xl border px-4 py-3 text-left text-sm font-bold transition",
                                    isSelected
                                      ? "border-[var(--accent)] bg-[rgba(245,158,11,0.12)] text-[var(--text-main)]"
                                      : "border-[var(--border-teal-soft)] bg-[var(--surface-muted)] text-[var(--text-soft)] hover:border-[var(--accent)]",
                                  ].join(" ")}
                                >
                                  {label}
                                </button>
                              )
                            })}
                          </div>

                          <p className="mt-2 text-sm text-[var(--text-muted)]">
                            Il backend tirerà il d20 per colpire e il dado
                            dell’azione scelta per il danno.
                          </p>
                        </div>

                        <label
                          htmlFor="target"
                          className="mt-5 block text-sm font-bold text-[var(--text-main)]"
                        >
                          Bersaglio
                        </label>

                        <select
                          id="target"
                          value={selectedTargetId ?? ""}
                          onChange={(event) =>
                            setSelectedTargetId(Number(event.target.value))
                          }
                          className="mt-2 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                        >
                          <option value="" disabled>
                            Seleziona un bersaglio
                          </option>

                          {availableTargets.map((fighter) => (
                            <option
                              key={fighter.characterId}
                              value={fighter.characterId}
                            >
                              {fighter.name} - HP {fighter.currentHp}/
                              {fighter.maxHp}
                            </option>
                          ))}
                        </select>
                      </div>

                      <AppButton
                        type="button"
                        disabled={!selectedTargetId || isAttacking}
                        onClick={handleAttack}
                      >
                        {isAttacking ? "Attacco in corso..." : "Attacca"}
                      </AppButton>
                    </div>
                  </AppCard>
                )}

                {attackResult && <AttackResultCard result={attackResult} />}

                {combatStatus.combatOver && (
                  <AppCard>
                    <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--accent-soft)]">
                      Combattimento concluso
                    </p>
                    <h3 className="mt-2 text-2xl font-black text-[var(--text-main)]">
                      Vincitore
                    </h3>
                    Vince{" "}
                    <span className="font-bold text-[var(--accent-soft)]">
                      {winnerFighter?.name ?? "personaggio sconosciuto"}
                    </span>
                  </AppCard>
                )}

                <div className="grid gap-5 xl:grid-cols-2">
                  {combatStatus.fighters.map((fighter) => (
                    <AppCard
                      key={fighter.characterId}
                      className={[
                        "transition",
                        fighter.currentTurn
                          ? "border-[var(--border-gold)] shadow-[var(--shadow-glow)]"
                          : "",
                        !fighter.alive ? "opacity-60" : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent-soft)]">
                            Iniziativa {fighter.initiative}
                          </p>

                          <h4 className="mt-2 text-xl font-black text-[var(--text-main)]">
                            {fighter.name}
                          </h4>

                          <p className="mt-1 text-sm font-bold text-[var(--text-soft)]">
                            {fighter.characterClass}
                          </p>
                        </div>

                        <span
                          className={[
                            "rounded-xl px-3 py-1 text-xs font-bold",
                            fighter.currentTurn
                              ? "bg-[var(--accent)] text-[var(--bg-app-deep)]"
                              : fighter.alive
                                ? "border border-[var(--border-teal-soft)] text-[var(--text-soft)]"
                                : "border border-red-700 bg-red-950 text-red-100",
                          ].join(" ")}
                        >
                          {fighter.currentTurn
                            ? "Turno attivo"
                            : fighter.alive
                              ? "In attesa"
                              : "Sconfitto"}
                        </span>
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
                          <p className="text-sm font-bold text-[var(--text-soft)]">
                            HP
                          </p>

                          <p className="mt-2 text-lg font-black text-[var(--text-main)]">
                            {fighter.currentHp} / {fighter.maxHp}
                          </p>

                          <div
                            className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-app-deep)]"
                            role="progressbar"
                            aria-label={`Punti vita ${fighter.currentHp} su ${fighter.maxHp}`}
                            aria-valuenow={fighter.currentHp}
                            aria-valuemin={0}
                            aria-valuemax={fighter.maxHp}
                          >
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                              style={{
                                width: `${
                                  fighter.maxHp > 0
                                    ? Math.round(
                                        (fighter.currentHp / fighter.maxHp) *
                                          100,
                                      )
                                    : 0
                                }%`,
                              }}
                            />
                          </div>
                        </div>

                        <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
                          <p className="text-sm font-bold text-[var(--text-soft)]">
                            Classe Armatura
                          </p>

                          <p className="mt-2 text-lg font-black text-[var(--text-main)]">
                            {fighter.armorClass}
                          </p>
                        </div>
                      </div>
                    </AppCard>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </AppShell>
  )
}
