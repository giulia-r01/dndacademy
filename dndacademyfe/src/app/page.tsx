export default function HomePage() {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] text-[var(--color-text)]">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 text-center">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-[var(--color-accent)]">
          DnD Academy
        </p>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Impara Dungeons & Dragons passo dopo passo.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-[var(--color-muted)]">
          Lezioni guidate, quiz, personaggi e combattimenti tutorial per
          iniziare a giocare senza perderti tra manuali, eccezioni e panico da
          d20.
        </p>
      </section>
    </main>
  )
}
