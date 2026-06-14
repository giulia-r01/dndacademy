type FantasyDieProps = {
  value: number
  dieLabel: string
  critical?: boolean
  failure?: boolean
}

export default function FantasyDie({
  value,
  dieLabel,
  critical = false,
  failure = false,
}: FantasyDieProps) {
  return (
    <div
      className={[
        "relative flex h-24 w-24 shrink-0 items-center justify-center",
        "animate-[fantasyDieRoll_800ms_ease-out]",
      ].join(" ")}
      aria-label={`${dieLabel}, risultato ${value}`}
    >
      <svg
        viewBox="0 0 120 120"
        className={[
          "absolute inset-0 h-full w-full drop-shadow-lg",
          critical ? "drop-shadow-[0_0_18px_rgba(245,158,11,0.65)]" : "",
          failure ? "drop-shadow-[0_0_18px_rgba(239,68,68,0.55)]" : "",
        ].join(" ")}
        aria-hidden="true"
      >
        <polygon
          points="60,6 106,34 96,92 60,114 24,92 14,34"
          className={[
            "stroke-2",
            critical
              ? "fill-[var(--accent)] stroke-[var(--border-gold)]"
              : failure
                ? "fill-red-950 stroke-red-700"
                : "fill-[var(--bg-app-deep)] stroke-[var(--border-gold)]",
          ].join(" ")}
        />

        <polygon points="60,6 106,34 60,48 14,34" className="fill-white/10" />
        <polygon points="14,34 60,48 24,92" className="fill-black/20" />
        <polygon points="106,34 60,48 96,92" className="fill-black/30" />
        <polygon points="24,92 60,48 96,92 60,114" className="fill-white/5" />

        <line
          x1="60"
          y1="6"
          x2="60"
          y2="114"
          className="stroke-[var(--border-gold)]/50 stroke-1"
        />
        <line
          x1="14"
          y1="34"
          x2="96"
          y2="92"
          className="stroke-[var(--border-gold)]/40 stroke-1"
        />
        <line
          x1="106"
          y1="34"
          x2="24"
          y2="92"
          className="stroke-[var(--border-gold)]/40 stroke-1"
        />
      </svg>

      <div className="relative z-10 text-center">
        <p
          className={[
            "text-3xl font-black",
            critical
              ? "text-[var(--bg-app-deep)]"
              : failure
                ? "text-red-100"
                : "text-[var(--text-main)]",
          ].join(" ")}
        >
          {value}
        </p>

        <p
          className={[
            "mt-1 text-xs font-black uppercase tracking-[0.18em]",
            critical
              ? "text-[var(--bg-app-deep)]/80"
              : failure
                ? "text-red-200"
                : "text-[var(--accent-soft)]",
          ].join(" ")}
        >
          {dieLabel}
        </p>
      </div>
    </div>
  )
}
