import type { ReactNode } from "react"
import AppCard from "@/components/common/AppCard"

type StatCardProps = {
  title: string
  value: string
  icon: ReactNode
}

export default function StatCard({ title, value, icon }: StatCardProps) {
  return (
    <AppCard className="flex items-center gap-4">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--accent)]">
        {icon}
      </div>

      <div>
        <p className="text-sm font-bold text-[var(--accent-soft)]">{title}</p>
        <p className="mt-1 text-2xl font-black text-[var(--text-main)]">
          {value}
        </p>
      </div>
    </AppCard>
  )
}
