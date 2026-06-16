"use client"

import {
  FiAlertTriangle,
  FiBookOpen,
  FiFlag,
  FiShield,
  FiUserPlus,
} from "react-icons/fi"

import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import AppButton from "@/components/common/AppButton"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import Link from "next/link"

const adminSections = [
  {
    title: "Campagne",
    description: "Crea e gestisci le campagne tutorial disponibili.",
    icon: FiFlag,
    href: "/admin/campaigns",
  },
  {
    title: "Personaggi",
    description: "Prepara personaggi che i player potranno scegliere.",
    icon: FiUserPlus,
    href: "/admin/characters",
  },
  {
    title: "Lezioni",
    description: "Gestisci i contenuti didattici del percorso.",
    icon: FiBookOpen,
    href: "/admin/lessons",
  },
  {
    title: "Badge",
    description: "Crea riconoscimenti e obiettivi per i player.",
    icon: FiShield,
    href: "/admin/badges",
  },
]

export default function AdminPage() {
  const { user, isLoading, error } = useCurrentUser()

  if (isLoading) {
    return (
      <AppShell>
        <AppCard>
          <p className="text-[var(--text-muted)]">
            Verifica permessi Master...
          </p>
        </AppCard>
      </AppShell>
    )
  }

  if (error) {
    return (
      <AppShell>
        <AppCard>
          <p role="alert" className="text-[var(--danger)]">
            {error}
          </p>
        </AppCard>
      </AppShell>
    )
  }

  if (user?.role !== "MASTER") {
    return (
      <AppShell>
        <section className="space-y-6">
          <AppCard>
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[rgba(239,68,68,0.12)] text-[var(--danger)]">
                <FiAlertTriangle size={24} aria-hidden="true" />
              </div>

              <div>
                <h2 className="text-2xl font-black text-[var(--text-main)]">
                  Accesso riservato
                </h2>

                <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                  Questa sezione è disponibile solo per utenti con ruolo Master.
                </p>

                <div className="mt-5">
                  <Link href="/dashboard">
                    <AppButton type="button">Torna alla dashboard</AppButton>
                  </Link>
                </div>
              </div>
            </div>
          </AppCard>
        </section>
      </AppShell>
    )
  }
  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
            Backoffice
          </p>

          <h2 className="mt-2 text-3xl font-black text-[var(--text-main)]">
            Area Master
          </h2>

          <p className="mt-2 max-w-2xl text-[var(--text-soft)]">
            Da qui il Master potrà creare campagne, personaggi, lezioni, quiz e
            badge per guidare il percorso didattico.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {adminSections.map((section) => {
            const Icon = section.icon

            return (
              <Link key={section.title} href={section.href}>
                <AppCard
                  key={section.title}
                  className="h-full transition hover:-translate-y-0.5 hover:border-[var(--border-gold)]"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
                      <Icon size={22} aria-hidden="true" />
                    </div>

                    <div>
                      <h3 className="text-xl font-black text-[var(--text-main)]">
                        {section.title}
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                        {section.description}
                      </p>
                    </div>
                  </div>
                </AppCard>
              </Link>
            )
          })}
        </div>
      </section>
    </AppShell>
  )
}
