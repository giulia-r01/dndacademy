import AppShell from "@/components/layout/AppShell"
import AppCard from "@/components/common/AppCard"

export default function CampaignsPage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)]">
            Campagne
          </h2>
          <p className="mt-2 text-[var(--text-soft)]">
            Scegli una campagna tutorial e fai pratica con regole, personaggi e
            combattimento.
          </p>
        </div>

        <AppCard>
          <p className="text-[var(--text-muted)]">
            Le campagne tutorial verranno collegate agli endpoint del backend.
          </p>
        </AppCard>
      </section>
    </AppShell>
  )
}
