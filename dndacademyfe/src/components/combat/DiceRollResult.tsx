import FantasyDie from "@/components/combat/FantasyDie"

type DiceRollResultProps = {
  label: string
  dieLabel: string
  value: number
  description?: string
  highlight?: boolean
  failure?: boolean
}

export default function DiceRollResult({
  label,
  dieLabel,
  value,
  description,
  highlight = false,
  failure = false,
}: DiceRollResultProps) {
  return (
    <div
      className={[
        "rounded-2xl border px-4 py-4 transition",
        highlight
          ? "border-[var(--border-gold)] bg-[rgba(245,158,11,0.12)] shadow-[var(--shadow-glow)]"
          : failure
            ? "border-red-800 bg-red-950/30"
            : "border-[var(--border-teal-soft)] bg-[var(--surface-muted)]",
      ].join(" ")}
    >
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent-soft)]">
        {label}
      </p>

      <div className="mt-4 flex items-center gap-4">
        <FantasyDie
          value={value}
          dieLabel={dieLabel}
          critical={highlight}
          failure={failure}
        />

        <div>
          <p className="text-lg font-black text-[var(--text-main)]">
            {dieLabel}
          </p>

          {description && (
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {description}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
