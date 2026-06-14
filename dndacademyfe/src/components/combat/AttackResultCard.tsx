import AppCard from "@/components/common/AppCard"
import DiceRollResult from "@/components/combat/DiceRollResult"
import type { AttackResult } from "@/types/combat"

type AttackResultCardProps = {
  result: AttackResult
}

export default function AttackResultCard({ result }: AttackResultCardProps) {
  const title = result.critical
    ? "Colpo critico!"
    : result.hit
      ? "Colpito!"
      : "Mancato!"

  const explanation = result.hit
    ? `Il totale di attacco ${result.totalAttack} supera o eguaglia la Classe Armatura ${result.targetArmorClass}.`
    : `Il totale di attacco ${result.totalAttack} non supera la Classe Armatura ${result.targetArmorClass}.`

  return (
    <AppCard
      className={[
        "space-y-5",
        result.critical
          ? "border-[var(--border-gold)] shadow-[var(--shadow-glow)]"
          : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-[var(--accent-soft)]">
          Risultato azione
        </p>

        <h3 className="mt-2 text-2xl font-black text-[var(--text-main)]">
          {title}
        </h3>

        <p className="mt-2 text-sm text-[var(--text-soft)]">
          <span className="font-bold text-[var(--accent-soft)]">
            {result.attackerName}
          </span>{" "}
          {result.critical
            ? "ha messo a segno un colpo critico contro"
            : result.hit
              ? "ha colpito"
              : "ha mancato"}{" "}
          <span className="font-bold text-[var(--accent-soft)]">
            {result.targetName}
          </span>{" "}
          con{" "}
          <span className="font-bold text-[var(--text-main)]">
            {result.actionName}
          </span>
          .
        </p>
      </div>

      <div
        className={[
          "grid gap-4",
          result.hit ? "lg:grid-cols-2" : "lg:grid-cols-1",
        ].join(" ")}
      >
        <DiceRollResult
          label="Tiro per colpire"
          dieLabel="d20"
          value={result.attackRoll}
          highlight={result.critical}
          failure={result.attackRoll === 1}
          description={`Modificatore ${result.abilityModifier >= 0 ? "+" : ""}${
            result.abilityModifier
          } → totale ${result.totalAttack}`}
        />

        {result.hit && (
          <DiceRollResult
            label="Dado danno"
            dieLabel={`d${result.damageDie}`}
            value={result.damageRoll}
            highlight
            description={`Danno finale: ${result.damage}`}
          />
        )}
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
          <p className="text-sm font-bold text-[var(--text-soft)]">
            Totale attacco
          </p>

          <p className="mt-2 text-lg font-black text-[var(--text-main)]">
            {result.totalAttack}
          </p>
        </div>

        <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
          <p className="text-sm font-bold text-[var(--text-soft)]">
            Classe Armatura
          </p>

          <p className="mt-2 text-lg font-black text-[var(--text-main)]">
            {result.targetArmorClass}
          </p>
        </div>

        <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
          <p className="text-sm font-bold text-[var(--text-soft)]">
            HP rimasti
          </p>

          <p className="mt-2 text-lg font-black text-[var(--text-main)]">
            {result.targetRemainingHp}
          </p>
        </div>
      </div>

      <p className="text-sm leading-6 text-[var(--text-soft)]">{explanation}</p>

      {result.targetDefeated && (
        <p className="rounded-xl bg-[rgba(239,68,68,0.12)] px-4 py-3 font-bold text-[var(--danger)]">
          Il bersaglio è stato sconfitto.
        </p>
      )}

      {result.combatOver && (
        <p className="rounded-xl border border-[var(--border-gold)]/40 bg-[rgba(245,158,11,0.12)] px-4 py-3 font-bold text-[var(--accent-soft)]">
          Combattimento concluso.
        </p>
      )}
    </AppCard>
  )
}
