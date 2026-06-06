import type { ReactNode } from "react"
import AppCard from "@/components/common/AppCard"

type AuthLayoutProps = {
  title: string
  subtitle: string
  children: ReactNode
}

export default function AuthLayout({
  title,
  subtitle,
  children,
}: AuthLayoutProps) {
  return (
    <main className="min-h-screen px-6 py-10 text-[var(--text-main)]">
      <section className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-10 lg:grid-cols-[1fr_420px]">
        <div className="max-w-2xl">
          <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] text-lg font-black text-white shadow-[var(--shadow-glow)]">
            D20
          </div>

          <p className="mb-4 text-sm font-bold uppercase tracking-[0.35em] text-[var(--accent-soft)]">
            D&D Academy
          </p>

          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
            Impara Dungeons & Dragons senza perderti nel manuale.
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-soft)]">
            Lezioni guidate, quiz, campagne tutorial e combattimenti base per
            trasformare la confusione iniziale in una vera avventura.
          </p>
        </div>

        <AppCard className="w-full">
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              {subtitle}
            </p>
          </div>

          {children}
        </AppCard>
      </section>
    </main>
  )
}
