"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import { FiArrowLeft, FiFlag, FiPlusCircle } from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import FormInput from "@/components/common/FormInput"
import AppShell from "@/components/layout/AppShell"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { campaignService } from "@/services/campaign.service"
import type { Campaign } from "@/types/campaign"

export default function AdminCampaignsPage() {
  const { user, isLoading: isCheckingUser, error: userError } = useCurrentUser()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")

  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const data = await campaignService.getAll()
        setCampaigns(data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento campagne"

        setError(message)
      } finally {
        setIsLoadingCampaigns(false)
      }
    }

    loadCampaigns()
  }, [])

  async function handleCreateCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setSuccessMessage("")

    if (!name.trim()) {
      setError("Il nome della campagna è obbligatorio.")
      return
    }

    if (!description.trim()) {
      setError("La descrizione della campagna è obbligatoria.")
      return
    }

    setIsCreating(true)

    try {
      const createdCampaign = await campaignService.create({
        name: name.trim(),
        description: description.trim(),
      })

      setCampaigns((current) => [createdCampaign, ...current])
      setName("")
      setDescription("")
      setSuccessMessage("Campagna creata correttamente.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella creazione campagna"

      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  if (isCheckingUser) {
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

  if (userError) {
    return (
      <AppShell>
        <AppCard className="border-danger">
          <p role="alert" className="text-danger">
            {userError}
          </p>
        </AppCard>
      </AppShell>
    )
  }

  if (user?.role !== "MASTER") {
    return (
      <AppShell>
        <AppCard className="border-danger">
          <p role="alert" className="text-danger">
            Accesso riservato agli utenti Master.
          </p>
        </AppCard>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-soft)] transition hover:text-[var(--accent-soft)]"
        >
          <FiArrowLeft aria-hidden="true" />
          Torna al backoffice
        </Link>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
            Backoffice
          </p>

          <h2 className="mt-2 text-3xl font-black text-[var(--text-main)]">
            Gestione campagne
          </h2>

          <p className="mt-2 max-w-2xl text-[var(--text-soft)]">
            Crea e visualizza le campagne tutorial che i player potranno
            esplorare.
          </p>
        </div>

        {error && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {error}
            </p>
          </AppCard>
        )}

        {successMessage && (
          <AppCard>
            <p role="status" className="text-[var(--primary)]">
              {successMessage}
            </p>
          </AppCard>
        )}

        <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
          <AppCard>
            <div className="mb-6 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
                <FiPlusCircle size={22} aria-hidden="true" />
              </div>

              <div>
                <h3 className="text-xl font-black text-[var(--text-main)]">
                  Nuova campagna
                </h3>

                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Crea una campagna tutorial per i player.
                </p>
              </div>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-5">
              <FormInput
                label="Nome campagna"
                name="name"
                type="text"
                placeholder="Es. La Maledizione del Drago"
                value={name}
                onChange={(event) => setName(event.target.value)}
              />

              <div className="space-y-2">
                <label
                  htmlFor="description"
                  className="block text-sm font-bold text-[var(--text-main)]"
                >
                  Descrizione
                </label>

                <textarea
                  id="description"
                  name="description"
                  rows={9}
                  placeholder="Descrivi l'ambientazione e l'obiettivo della campagna."
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className="w-full resize-none rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                />
              </div>

              <AppButton type="submit" fullWidth disabled={isCreating}>
                {isCreating ? "Creazione..." : "Crea campagna"}
              </AppButton>
            </form>
          </AppCard>

          <div className="space-y-4">
            <div>
              <h3 className="text-2xl font-black text-[var(--text-main)]">
                Campagne esistenti
              </h3>

              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Elenco delle campagne disponibili nella piattaforma.
              </p>
            </div>

            {isLoadingCampaigns && (
              <AppCard>
                <p className="text-[var(--text-muted)]">
                  Caricamento campagne...
                </p>
              </AppCard>
            )}

            {!isLoadingCampaigns && campaigns.length === 0 && (
              <AppCard>
                <p className="text-[var(--text-muted)]">
                  Non ci sono ancora campagne.
                </p>
              </AppCard>
            )}

            {!isLoadingCampaigns && campaigns.length > 0 && (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <AppCard key={campaign.id}>
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
                        <FiFlag size={21} aria-hidden="true" />
                      </div>

                      <div>
                        <h4 className="text-lg font-black text-[var(--text-main)]">
                          {campaign.name}
                        </h4>

                        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                          {campaign.description || "Nessuna descrizione."}
                        </p>

                        <p className="mt-3 text-xs font-bold text-[var(--accent-soft)]">
                          Master: {campaign.masterUsername}
                        </p>
                      </div>
                    </div>
                  </AppCard>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </AppShell>
  )
}
