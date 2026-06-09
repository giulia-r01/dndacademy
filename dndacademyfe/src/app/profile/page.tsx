import AppShell from "@/components/layout/AppShell"
import AppCard from "@/components/common/AppCard"

export default function ProfilePage() {
  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)]">
            Profilo
          </h2>
          <p className="mt-2 text-[var(--text-soft)]">
            Gestisci le informazioni principali del tuo account.
          </p>
        </div>

        <AppCard>
          <p className="text-[var(--text-muted)]">
            Qui mostreremo username, email, ruolo e livello di apprendimento.
          </p>
        </AppCard>
      </section>
    </AppShell>
  )
}
