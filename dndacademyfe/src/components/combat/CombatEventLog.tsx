import type { CombatEvent } from "@/types/combat"
export default function CombatEventLog({ event }: { event: CombatEvent }) {
  return <>
    <p>{event.actionType === "HEAL" ? `Cura: +${event.healing ?? 0} HP` : `${event.critical ? "Critico! " : ""}${event.hit ? `${event.damage} danni` : "Mancato"}`} · HP {event.targetHpBefore} → {event.targetRemainingHp}{event.actionType === "HEAL" && event.targetHpBefore === 0 ? " · Torna in combattimento" : ""}</p>
    <p className="text-xs text-[var(--text-muted)]">{event.actionType === "HEAL" ? `Cura d${event.healingDie}: ${event.healingRoll} · HP recuperati: ${event.healing}` : `d20 ${event.attackRoll} · Totale ${event.totalAttack} · CA ${event.targetArmorClass}`}</p>
  </>
}
