import type { ReactNode } from "react"
import AppCard from "@/components/common/AppCard"

type AchievementCardProps = {
  title: string
  description: string
  icon: ReactNode
  unlocked?: boolean
}

export default function AchievementCard({
  title,
  description,
  icon,
  unlocked = false,
}: AchievementCardProps) {
  return (
    <AppCard
      className={[
        "flex items-center gap-4",
        unlocked ? "border-[var(--border-gold)]" : "opacity-70",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-12 w-12 items-center justify-center rounded-xl",
          unlocked
            ? "bg-[var(--accent)] text-[var(--bg-app-deep)]"
            : "bg-[var(--surface-muted)] text-[var(--text-muted)]",
        ].join(" ")}
      >
        {icon}
      </div>

      <div>
        <h3 className="font-black text-[var(--text-main)]">{title}</h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
      </div>
    </AppCard>
  )
}
