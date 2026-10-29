import FantasyDie from "@/components/combat/FantasyDie"
import type { CombatEvent } from "@/types/combat"
export default function HealingResult({ event, attacker, target }: { event: CombatEvent; attacker: string; target: string }) {
  return <div role="status" aria-live="polite" className="space-y-4">
    <p className="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)]">Ultima azione</p>
    <h4 className="text-2xl font-black text-emerald-300">Cura effettuata! +{event.healing} HP</h4>
    <p className="text-sm">{attacker} → {target}</p>
    <p className="text-sm font-bold">HP {event.targetHpBefore} → {event.targetRemainingHp}{event.targetHpBefore === 0 ? " · Torna in combattimento" : ""}</p>
    <div className="flex flex-wrap items-center justify-center gap-6 rounded-2xl bg-[var(--surface-muted)] p-5">
      <FantasyDie value={event.healingRoll ?? 0} dieLabel={`d${event.healingDie}`} />
      <span className="text-4xl font-black text-emerald-300">+{event.healing} HP</span>
    </div>
  </div>
}
