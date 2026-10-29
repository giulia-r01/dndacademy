"use client"

import { useEffect, useState } from "react"
import { FiCrosshair, FiHeart, FiShield } from "react-icons/fi"
import AppButton from "@/components/common/AppButton"
import EntityPortrait from "@/components/common/EntityPortrait"
import CombatEventLog from "@/components/combat/CombatEventLog"
import HealingResult from "@/components/combat/HealingResult"
import FantasyDie from "@/components/combat/FantasyDie"
import type { AttackResult, CombatActionType, CombatFighter, CombatStatus } from "@/types/combat"
import styles from "./CombatArena.module.css"

type Props = {
  status: CombatStatus
  attackResult: AttackResult | null
  selectedTargetId: number | null
  actionType: CombatActionType
  isBusy: boolean
  onSelectTarget: (id: number | null) => void
  onSelectAction: (action: CombatActionType) => void
  onAttack: () => Promise<void>
  onNpcTurn: () => Promise<void>
  onRestart: () => Promise<void>
}

export default function CombatArena({ status, attackResult, selectedTargetId, actionType, isBusy, onSelectTarget, onSelectAction, onAttack, onNpcTurn, onRestart }: Props) {
  const current = status.fighters.find(f => f.participantId === status.currentTurnParticipantId)
  const player = status.fighters.find(f => f.characterId !== null)
  const npcs = status.fighters.filter(f => f.npcId !== null)
  const enemies = npcs.filter(f => f.enemy && f.alive)
  const event = status.events.at(-1)
  const canAct = !status.completed && current?.characterId != null && current.alive
  const [presentedEventCount, setPresentedEventCount] = useState(0)
  const presentingAction = status.events.length > presentedEventCount && !status.completed
  const actionNpc = npcs.find(f => f.participantId === event?.targetId)
    ?? npcs.find(f => f.participantId === event?.attackerId)
  const focused = ((presentingAction || status.completed) ? actionNpc : null)
    ?? (current?.npcId != null ? current : null)
    ?? npcs.find(f => f.participantId === selectedTargetId)
    ?? actionNpc ?? enemies[0] ?? npcs[0]
  const controlsBusy = isBusy || presentingAction

  useEffect(() => {
    if (!presentingAction) return
    const timer = window.setTimeout(() => setPresentedEventCount(status.events.length), 1600)
    return () => window.clearTimeout(timer)
  }, [presentingAction, status.events.length])

  function name(f: CombatFighter) {
    const duplicates = status.fighters.filter(item => item.name === f.name)
    return duplicates.length > 1 ? `${f.name} ${duplicates.findIndex(item => item.participantId === f.participantId) + 1}` : f.name
  }
  function eventName(id: number, fallback: string) {
    const fighter = status.fighters.find(item => item.participantId === id)
    return fighter ? name(fighter) : fallback
  }
  function portrait(fighter: CombatFighter, own: boolean) {
    const damaged = event?.actionType !== "HEAL" && event?.hit && event.targetId === fighter.participantId
    return <article aria-label={`Scheda di ${name(fighter)}`} key={`${fighter.participantId}-${damaged ? status.events.length : "idle"}`}
      className={`${styles.fighter} min-w-0 rounded-2xl border bg-[var(--surface)] ${damaged ? `border-red-500 ${styles.impact}` : fighter.currentTurn && !status.completed ? "border-[var(--border-gold)]" : "border-[var(--border-teal-soft)]"}`}>
      <EntityPortrait name={name(fighter)} imageUrl={fighter.imageUrl} className={styles.portrait} />
      <div className={`${styles.fighterInfo} space-y-2`}>
        <div><p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-soft)]">{own ? "Il tuo personaggio" : fighter.enemy ? "Nemico" : fighter.healer ? "Guaritore" : "Aiutante"}</p>
          <h3 className="mt-1 break-words font-black">{name(fighter)}</h3></div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold">
          <span className={`flex items-center gap-1 ${fighter.currentHp <= fighter.maxHp / 3 ? "text-red-400" : ""}`}><FiHeart aria-hidden="true" /> {fighter.currentHp}/{fighter.maxHp} HP</span>
          <span className="flex items-center gap-1"><FiShield aria-hidden="true" /> CA {fighter.armorClass}</span>
        </div>
        <div role="progressbar" aria-label={`HP di ${name(fighter)}`} aria-valuemin={0} aria-valuemax={fighter.maxHp} aria-valuenow={fighter.currentHp} className="h-2 overflow-hidden rounded-full bg-[var(--bg-app-deep)]">
          <div className={`h-full transition-[width] duration-700 motion-reduce:transition-none ${fighter.currentHp <= fighter.maxHp / 3 ? "bg-red-500" : "bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"}`} style={{ width: `${Math.max(0, Math.min(100, fighter.currentHp / Math.max(1, fighter.maxHp) * 100))}%` }} />
        </div>
        {fighter.healer && <p className="text-sm font-bold text-emerald-300">Cure rimaste: {fighter.healingUsesRemaining ?? 0}</p>}
        {!fighter.alive && <p className="text-sm font-bold text-red-400">Sconfitto</p>}
        {damaged && <p className="text-sm font-bold text-red-400">Ultimo colpo: −{event.damage} HP</p>}
      </div>
    </article>
  }

  return <div className={`${styles.layout} space-y-3`}>
    <div className={styles.toolbar}>
    <nav aria-label="Ordine di iniziativa" className="rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface)] p-3">
      <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-[var(--accent-soft)]">Ordine di iniziativa</h3>
      <ol className={styles.initiative} tabIndex={0} aria-label="Sequenza dei turni">{status.fighters.map(f => <li key={f.participantId} className="shrink-0">
        <button type="button" disabled={controlsBusy} aria-current={f.currentTurn && !status.completed ? "step" : undefined}
          onClick={() => {
            if (canAct && f.enemy && f.alive) onSelectTarget(f.participantId)
          }}
          className={`rounded-xl border px-3 py-2 text-left text-sm transition ${f.currentTurn && !status.completed ? "border-[var(--border-gold)] bg-amber-400/10" : "border-transparent bg-[var(--surface-muted)]"} ${!f.alive ? "opacity-50" : ""}`}>
          <span className="block truncate font-bold">{name(f)}{f.currentTurn && !status.completed ? " · In turno" : ""}</span>
          <span className="text-xs text-[var(--text-muted)]">{f.enemy ? "Nemico" : f.characterId !== null ? "Tu" : "Aiutante"} · Iniziativa {f.initiative} · {f.alive ? `HP ${f.currentHp}/${f.maxHp}` : "Sconfitto"}</span>
        </button>
      </li>)}</ol>
    </nav>

        <div className={styles.turn}>
          <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--accent-soft)]">{status.completed ? "Combattimento concluso" : "Turno corrente"}</p>
          <h3 className="mt-1 text-xl font-black" aria-live="polite">{status.completed ? status.outcome === "PLAYER_VICTORY" ? player && !player.alive ? "Vittoria del gruppo" : "Vittoria!" : "Sconfitta" : canAct ? `È il tuo turno, ${current ? name(current) : ""}` : `Tocca a ${current ? name(current) : "..."}`}</h3></div>
        </div>

    </div>
    <div className={styles.arena}>
      <div className={styles.player}>{player && portrait(player, true)}</div>
      <section aria-label="Arena e comandi di combattimento" className={`${styles.stage} flex min-w-0 flex-col rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface)]`}>
        <div className={styles.actionBody}>
          {event?.actionType === "HEAL" ? <HealingResult event={event} attacker={eventName(event.attackerId, event.attackerName)} target={eventName(event.targetId, event.targetName)} /> : event ? <div key={status.events.length} className={`${styles.result} space-y-4 ${styles.arrival}`}>
            <div role="status" aria-live="polite" aria-atomic="true">
              <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Ultima azione</p>
              <h4 className={`mt-1 text-2xl font-black ${event.hit && event.targetId === player?.participantId ? "text-red-400" : "text-[var(--accent-soft)]"}`}>
                {event.targetId === player?.participantId ? event.hit ? `Sei stato colpito! −${event.damage} HP` : "Hai evitato l'attacco!" : event.critical ? "Colpo critico!" : event.hit ? "Colpo a segno!" : "Attacco mancato"}
              </h4>
              <p className="mt-2 text-sm">{eventName(event.attackerId, event.attackerName)} → {eventName(event.targetId, event.targetName)}</p>
              <p className="mt-1 text-sm font-bold">{event.hit ? `${event.damage} danni` : "Nessun danno"} · HP {event.targetHpBefore} → {event.targetRemainingHp}{event.targetRemainingHp === 0 ? " · Sconfitto" : ""}</p>
            </div>
            <div className={styles.dice}>
              <div className="flex flex-col items-center gap-2"><FantasyDie value={event.attackRoll} dieLabel="d20" critical={event.critical} failure={event.attackRoll === 1} /><p className="text-xs text-[var(--text-soft)]">Tiro per colpire · Totale {event.totalAttack}</p></div>
              {event.hit && <div className="flex flex-col items-center gap-2">
                {attackResult && attackResult.attackerId === event.attackerId && attackResult.targetId === event.targetId
                  ? <FantasyDie value={attackResult.damageRoll} dieLabel={`d${attackResult.damageDie}`} critical={event.critical} />
                  : <span className="flex h-24 w-24 items-center justify-center rounded-full border border-red-500/40 bg-red-500/10 text-4xl font-black text-red-400">−{event.damage}</span>}
                <p className="text-xs text-[var(--text-soft)]">Danni inflitti · {event.damage}</p>
              </div>}
            </div>
            <details className="text-xs text-[var(--text-muted)]"><summary className="cursor-pointer">Dettagli del tiro</summary><p className="mt-2">d20: {event.attackRoll} · Totale: {event.totalAttack} · CA: {event.targetArmorClass}. {event.attackRoll === 20 ? "Il 20 naturale è un critico." : event.attackRoll === 1 ? "L'1 naturale manca sempre." : event.hit ? "Il totale raggiunge la Classe Armatura." : "Il totale non raggiunge la Classe Armatura."}</p></details>
          </div> : <div className="space-y-4 text-center text-[var(--text-soft)]"><FiCrosshair size={56} className="mx-auto text-[var(--accent-soft)]" aria-hidden="true" /><p className="font-bold">Lo scontro sta per iniziare</p><p className="text-sm">{canAct ? "Scegli un nemico e prepara il tuo attacco." : "Prosegui per vedere la prima azione."}</p></div>}
        </div>
        <div className={`${styles.controls} space-y-3`}>
          {presentingAction && <p role="status" className="text-xs font-bold text-[var(--accent-soft)]">{event?.actionType === "HEAL" ? `Cura su ${eventName(event.targetId, event.targetName)}` : focused ? `Azione su ${name(focused)}` : "Azione in corso"} · prossimo turno tra poco…</p>}
          {status.completed ? <>
            {status.outcome === "PLAYER_VICTORY" && player && !player.alive && <p className="text-sm font-bold text-[var(--accent-soft)]">{player.name} è fuori combattimento. Gli alleati hanno sconfitto tutti i nemici.</p>}
            <p className="text-sm">{status.outcome === "PLAYER_VICTORY" ? "Torna al capitolo per completarlo e ottenere la ricompensa." : "Puoi tentare un nuovo combattimento."}</p>
            {status.outcome === "ENEMY_VICTORY" && <AppButton type="button" disabled={isBusy} onClick={onRestart}>Riprova</AppButton>}
          </> : canAct && current ? <>
            <fieldset disabled={isBusy} className="space-y-2">
              <legend className="mb-2 text-sm font-bold">La tua azione</legend>
              <div className="flex flex-wrap gap-2">
                <AppButton type="button" aria-pressed={actionType === "WEAPON"} variant={actionType === "WEAPON" ? "primary" : "secondary"} onClick={() => onSelectAction("WEAPON")} className="px-3 py-2">{current.weaponName} · d{current.damageDie}</AppButton>
                {current.spellcaster && <AppButton type="button" aria-pressed={actionType === "SPELL"} variant={actionType === "SPELL" ? "primary" : "secondary"} onClick={() => onSelectAction("SPELL")} className="px-3 py-2">{current.spellName} · d{current.spellDamageDie}</AppButton>}
              </div>
            </fieldset>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <label className="min-w-0 flex-1 text-sm font-bold">Bersaglio
                <select aria-label="Bersaglio" disabled={isBusy} value={selectedTargetId ?? ""} onChange={e => { onSelectTarget(e.target.value ? Number(e.target.value) : null) }} className="mt-1 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface)] px-3 py-3">
                  <option value="">Seleziona un nemico</option>{enemies.map(f => <option key={f.participantId} value={f.participantId}>{name(f)} · HP {f.currentHp}/{f.maxHp}</option>)}
                </select>
              </label>
              <AppButton type="button" disabled={controlsBusy || selectedTargetId === null} onClick={onAttack}>{isBusy ? "Attacco..." : "Attacca"}</AppButton>
            </div>
          </> : <>
            <p className="text-sm text-[var(--text-soft)]">{current?.enemy ? "Il nemico prepara il suo attacco." : "Il tuo aiutante si prepara ad agire."}</p>
            <AppButton type="button" disabled={isBusy || !current?.alive || current.npcId === null} onClick={onNpcTurn} fullWidth>{isBusy ? "Azione in corso..." : `Mostra l'azione di ${current ? name(current) : "..."}`}</AppButton>
          </>}
        </div>
      </section>
      <div className={styles.opponent} aria-live="polite">
        <p className="sr-only">{focused ? `Ora in scena: ${name(focused)}` : ""}</p>
        {focused && <div key={focused.participantId} className={styles.arrival}>
          {portrait(focused, false)}
        </div>}
      </div>

    </div>

    <details className="rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface)] p-4">
      <summary className="cursor-pointer font-bold">Registro del combattimento · {status.events.length} {status.events.length === 1 ? "azione" : "azioni"}</summary>
      {status.events.length === 0 ? <p className="mt-3 text-sm text-[var(--text-soft)]">Nessuna azione ancora eseguita.</p> : <ol reversed className="mt-3 max-h-72 space-y-2 overflow-y-auto">{status.events.map((item, index) => ({ item, index })).reverse().map(({ item, index }) => <li key={index} className="rounded-xl bg-[var(--surface-muted)] p-3 text-sm">
        <p className="font-bold">{index + 1}. {eventName(item.attackerId, item.attackerName)} → {eventName(item.targetId, item.targetName)}</p>
        <CombatEventLog event={item} />
      </li>)}</ol>}
    </details>
  </div>
}
