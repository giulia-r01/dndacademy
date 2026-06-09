import AppShell from "@/components/layout/AppShell"
import AppCard from "@/components/common/AppCard"

export default function AchievementsPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)]">Badge</h2>
          <p className="mt-2 text-[var(--text-soft)]">
            Monitora i traguardi sbloccati durante il tuo percorso.
          </p>
        </div>

        <AppCard>
          <p className="text-[var(--text-muted)]">
            Qui mostreremo i badge ottenuti e quelli ancora bloccati.
          </p>
        </AppCard>
      </section>
    </AppShell>
  )
}
