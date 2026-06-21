import AppButton from "@/components/common/AppButton"

export default function HomePage() {
  return (
    <main className="min-h-screen px-6 py-10 text-[var(--text-main)]">
      <section className="mx-auto flex min-h-[80vh] max-w-5xl flex-col items-center justify-center text-center">
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] font-bold text-white shadow-[var(--shadow-glow)]">
          D&D
        </div>

        <p className="mb-3 text-sm font-bold uppercase tracking-[0.35em] text-[var(--accent-soft)]">
          DnD Academy
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Impara Dungeons & Dragons passo dopo passo.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--text-soft)]">
          Lezioni guidate, quiz, personaggi e combattimenti tutorial per
          iniziare a giocare senza perderti tra manuali, eccezioni e panico da
          d20.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <AppButton href="/login" className="sm:min-w-40">
            Accedi
          </AppButton>
          <AppButton
            href="/register"
            variant="secondary"
            className="sm:min-w-40"
          >
            Registrati
          </AppButton>
        </div>
      </section>
    </main>
  )
}
