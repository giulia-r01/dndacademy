import AppShell from "@/components/layout/AppShell"
import AppCard from "@/components/common/AppCard"

export default function LessonsPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)]">
            Lezioni
          </h2>
          <p className="mt-2 text-[var(--text-soft)]">
            Qui troverai il percorso didattico per imparare Dungeons & Dragons.
          </p>
        </div>

        <AppCard>
          <p className="text-[var(--text-muted)]">
            Le lezioni saranno collegate al backend nel prossimo modulo.
          </p>
        </AppCard>
      </section>
    </AppShell>
  )
}
