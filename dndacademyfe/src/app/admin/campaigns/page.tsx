"use client"

import { useEffect, useState, type FormEvent } from "react"
import Link from "next/link"
import {
  FiArrowLeft,
  FiFlag,
  FiPlusCircle,
  FiEdit3,
  FiTrash2,
  FiList,
} from "react-icons/fi"
import AppModal from "@/components/common/AppModal"

import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import FormInput from "@/components/common/FormInput"
import AppShell from "@/components/layout/AppShell"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { campaignService } from "@/services/campaign.service"
import type { Campaign } from "@/types/campaign"

const difficultyOptions = [
  { value: "BEGINNER", label: "Principiante" },
  { value: "INTERMEDIATE", label: "Intermedio" },
  { value: "ADVANCED", label: "Avanzato" },
] as const

function getDifficultyLabel(difficulty: Campaign["difficulty"]) {
  const option = difficultyOptions.find((item) => item.value === difficulty)

  return option?.label ?? difficulty
}

export default function AdminCampaignsPage() {
  const { user, isLoading: isCheckingUser, error: userError } = useCurrentUser()

  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [difficulty, setDifficulty] =
    useState<Campaign["difficulty"]>("BEGINNER")

  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true)
  const [isCreating, setIsCreating] = useState(false)

  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  const [campaignToEdit, setCampaignToEdit] = useState<Campaign | null>(null)
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(
    null,
  )
  const [campaignBlockedByChapters, setCampaignBlockedByChapters] =
    useState<Campaign | null>(null)

  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editDifficulty, setEditDifficulty] =
    useState<Campaign["difficulty"]>("BEGINNER")

  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  function openEditModal(campaign: Campaign) {
    setCampaignToEdit(campaign)
    setEditName(campaign.name)
    setEditDescription(campaign.description ?? "")
    setEditDifficulty(campaign.difficulty)
    setError("")
    setSuccessMessage("")
  }

  function closeEditModal() {
    setCampaignToEdit(null)
    setEditName("")
    setEditDescription("")
    setEditDifficulty("BEGINNER")
  }

  function openDeleteModal(campaign: Campaign) {
    setError("")
    setSuccessMessage("")

    if (campaign.chaptersCount > 0) {
      setCampaignBlockedByChapters(campaign)
      return
    }

    setCampaignToDelete(campaign)
  }

  function closeDeleteModal() {
    setCampaignToDelete(null)
  }

  function closeBlockedByChaptersModal() {
    setCampaignBlockedByChapters(null)
  }

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
        difficulty,
      })

      setCampaigns((current) => [createdCampaign, ...current])
      setName("")
      setDescription("")
      setDifficulty("BEGINNER")
      setSuccessMessage("Campagna creata correttamente.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella creazione campagna"

      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  async function handleUpdateCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!campaignToEdit) {
      return
    }

    setError("")
    setSuccessMessage("")

    if (!editName.trim()) {
      setError("Il nome della campagna è obbligatorio.")
      return
    }

    if (!editDescription.trim()) {
      setError("La descrizione della campagna è obbligatoria.")
      return
    }

    setIsUpdating(true)

    try {
      const updatedCampaign = await campaignService.update(campaignToEdit.id, {
        name: editName.trim(),
        description: editDescription.trim(),
        difficulty: editDifficulty,
      })

      setCampaigns((current) =>
        current.map((campaign) =>
          campaign.id === updatedCampaign.id ? updatedCampaign : campaign,
        ),
      )

      setSuccessMessage("Campagna aggiornata correttamente.")
      closeEditModal()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella modifica campagna"

      setError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  async function handleDeleteCampaign() {
    if (!campaignToDelete) {
      return
    }

    setError("")
    setSuccessMessage("")
    setIsDeleting(true)

    try {
      await campaignService.remove(campaignToDelete.id)

      setCampaigns((current) =>
        current.filter((campaign) => campaign.id !== campaignToDelete.id),
      )

      setSuccessMessage("Campagna eliminata correttamente.")
      closeDeleteModal()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nell'eliminazione campagna"

      setError(message)
    } finally {
      setIsDeleting(false)
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
          <AppCard className="self-start">
            <p role="status" className="text-[var(--primary)]">
              {successMessage}
            </p>
          </AppCard>
        )}

        <div className="grid items-start gap-6 xl:grid-cols-[420px_1fr]">
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

              <div className="space-y-2">
                <label
                  htmlFor="difficulty"
                  className="block text-sm font-bold text-[var(--text-main)]"
                >
                  Difficoltà
                </label>

                <select
                  id="difficulty"
                  value={difficulty}
                  onChange={(event) =>
                    setDifficulty(event.target.value as Campaign["difficulty"])
                  }
                  className="w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                >
                  {difficultyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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

                        <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-soft)]">
                          {getDifficultyLabel(campaign.difficulty)}
                        </p>

                        <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                          {campaign.description || "Nessuna descrizione."}
                        </p>

                        <p className="mt-3 text-xs font-bold text-[var(--accent-soft)]">
                          Master: {campaign.masterUsername}
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                          <Link
                            href={`/admin/campaigns/${campaign.id}/chapters`}
                          >
                            <AppButton type="button" variant="secondary">
                              <span className="inline-flex items-center gap-2">
                                <FiList aria-hidden="true" />
                                Capitoli
                              </span>
                            </AppButton>
                          </Link>

                          <AppButton
                            type="button"
                            variant="secondary"
                            onClick={() => openEditModal(campaign)}
                          >
                            <span className="inline-flex items-center gap-2">
                              <FiEdit3 aria-hidden="true" />
                              Modifica
                            </span>
                          </AppButton>

                          <AppButton
                            type="button"
                            variant="danger"
                            onClick={() => openDeleteModal(campaign)}
                          >
                            <span className="inline-flex items-center gap-2">
                              <FiTrash2 aria-hidden="true" />
                              Elimina
                            </span>
                          </AppButton>
                        </div>
                      </div>
                    </div>
                  </AppCard>
                ))}
              </div>
            )}
          </div>
        </div>
        <AppModal
          isOpen={campaignToEdit !== null}
          title="Modifica campagna"
          description="Aggiorna nome e descrizione della campagna."
          onClose={closeEditModal}
        >
          <form onSubmit={handleUpdateCampaign} className="space-y-5">
            <FormInput
              label="Nome campagna"
              name="editName"
              type="text"
              placeholder="Nome campagna"
              value={editName}
              onChange={(event) => setEditName(event.target.value)}
            />

            <div className="space-y-2">
              <label
                htmlFor="editDescription"
                className="block text-sm font-bold text-[var(--text-main)]"
              >
                Descrizione
              </label>

              <textarea
                id="editDescription"
                name="editDescription"
                rows={8}
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                className="w-full resize-none rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="editDifficulty"
                className="block text-sm font-bold text-[var(--text-main)]"
              >
                Difficoltà
              </label>

              <select
                id="editDifficulty"
                value={editDifficulty}
                onChange={(event) =>
                  setEditDifficulty(
                    event.target.value as Campaign["difficulty"],
                  )
                }
                className="w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              >
                {difficultyOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <AppButton
                type="button"
                variant="secondary"
                onClick={closeEditModal}
              >
                Annulla
              </AppButton>

              <AppButton type="submit" disabled={isUpdating}>
                {isUpdating ? "Salvataggio..." : "Salva modifiche"}
              </AppButton>
            </div>
          </form>
        </AppModal>
        <AppModal
          isOpen={campaignToDelete !== null}
          title="Eliminazione campagna"
          description="Questa azione non può essere annullata."
          onClose={closeDeleteModal}
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Vuoi davvero eliminare{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {campaignToDelete?.name}
              </span>
              ?
            </p>

            <p className="rounded-xl bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm font-bold text-[var(--danger)]">
              Puoi eliminare solo campagne senza personaggi o combattimenti
              collegati.
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <AppButton
                type="button"
                variant="secondary"
                onClick={closeDeleteModal}
              >
                No, annulla
              </AppButton>

              <AppButton
                type="button"
                variant="danger"
                disabled={isDeleting}
                onClick={handleDeleteCampaign}
              >
                {isDeleting ? "Eliminazione..." : "Sì, elimina"}
              </AppButton>
            </div>
          </div>
        </AppModal>
        <AppModal
          isOpen={campaignBlockedByChapters !== null}
          title="Campagna non eliminabile"
          description="Questa campagna contiene ancora dei capitoli."
          onClose={closeBlockedByChaptersModal}
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Non puoi eliminare{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {campaignBlockedByChapters?.name}
              </span>{" "}
              perché contiene ancora{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {campaignBlockedByChapters?.chaptersCount}
              </span>{" "}
              {campaignBlockedByChapters?.chaptersCount === 1
                ? "capitolo"
                : "capitoli"}
              .
            </p>

            <p className="rounded-xl bg-[rgba(245,158,11,0.12)] px-4 py-3 text-sm font-bold text-[var(--accent-soft)]">
              Per eliminare questa campagna devi prima eliminare tutti i
              capitoli associati.
            </p>

            <div className="flex justify-end">
              <AppButton
                type="button"
                variant="secondary"
                onClick={closeBlockedByChaptersModal}
              >
                Ho capito
              </AppButton>
            </div>
          </div>
        </AppModal>
      </section>
    </AppShell>
  )
}
