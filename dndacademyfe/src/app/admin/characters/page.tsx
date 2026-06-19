"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { FiArrowLeft, FiPlusCircle, FiUsers } from "react-icons/fi"

import CharacterFormModal from "@/components/admin/characters/CharacterFormModal"
import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import AdminCharacterCard from "@/components/admin/characters/AdminCharacterCard"
import AppModal from "@/components/common/AppModal"
import type { Character } from "@/types/character"
import { useAdminCharacters } from "@/hooks/useAdminCharacters"
import { useCharacterForm } from "@/hooks/useCharacterForm"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export default function AdminCharactersPage() {
  const { user, isLoading: isCheckingUser, error: userError } = useCurrentUser()

  const adminCharacters = useAdminCharacters()
  const characterForm = useCharacterForm()

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const [characterToEdit, setCharacterToEdit] = useState<Character | null>(null)
  const [characterToDelete, setCharacterToDelete] = useState<Character | null>(
    null,
  )
  const [modalError, setModalError] = useState("")

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
        <AppCard>
          <p role="alert" className="text-[var(--danger)]">
            {userError}
          </p>
        </AppCard>
      </AppShell>
    )
  }

  if (user?.role !== "MASTER") {
    return (
      <AppShell>
        <AppCard>
          <p role="alert" className="text-[var(--danger)]">
            Accesso riservato agli utenti Master.
          </p>
        </AppCard>
      </AppShell>
    )
  }

  function openCreateModal() {
    adminCharacters.setError("")
    adminCharacters.setSuccessMessage("")
    characterForm.resetForm()
    setIsCreateModalOpen(true)
    setModalError("")
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false)
    characterForm.resetForm()
    setModalError("")
  }

  async function handleCreateCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!adminCharacters.selectedCampaignId) {
      adminCharacters.setError(
        "Seleziona una campagna prima di creare un personaggio.",
      )
      return
    }

    const validationError = characterForm.validateForm()

    if (validationError) {
      setModalError(validationError)
      return
    }

    setModalError("")

    const wasCreated = await adminCharacters.createCharacter(
      characterForm.buildCreatePayload(adminCharacters.selectedCampaignId),
      characterForm.values.imageFile,
    )

    if (wasCreated) {
      closeCreateModal()
    }
  }

  function openEditModal(character: Character) {
    adminCharacters.setError("")
    adminCharacters.setSuccessMessage("")
    characterForm.fillFormFromCharacter(character)
    setCharacterToEdit(character)
    setModalError("")
  }

  function closeEditModal() {
    setCharacterToEdit(null)
    characterForm.resetForm()
    setModalError("")
  }

  async function handleUpdateCharacter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!characterToEdit) {
      return
    }

    const validationError = characterForm.validateForm()

    if (validationError) {
      setModalError(validationError)
      return
    }

    const wasUpdated = await adminCharacters.updateCharacter(
      characterToEdit.id,
      characterForm.buildUpdatePayload(),
      characterForm.values.imageFile,
    )

    if (wasUpdated) {
      closeEditModal()
    }
  }

  function openDeleteModal(character: Character) {
    adminCharacters.setError("")
    adminCharacters.setSuccessMessage("")
    setCharacterToDelete(character)
  }

  function closeDeleteModal() {
    setCharacterToDelete(null)
  }

  async function handleDeleteCharacter() {
    if (!characterToDelete) {
      return
    }

    const wasDeleted = await adminCharacters.deleteCharacter(
      characterToDelete.id,
    )

    if (wasDeleted) {
      closeDeleteModal()
    }
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

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
              Backoffice
            </p>

            <h2 className="mt-2 text-3xl font-black text-[var(--text-main)]">
              Gestione personaggi
            </h2>

            <p className="mt-2 max-w-2xl text-[var(--text-soft)]">
              Crea e gestisci i personaggi che i player potranno scegliere nelle
              campagne tutorial.
            </p>
          </div>

          <AppButton
            type="button"
            disabled={!adminCharacters.selectedCampaignId}
            onClick={openCreateModal}
          >
            <span className="inline-flex items-center gap-2">
              <FiPlusCircle aria-hidden="true" />
              Nuovo personaggio
            </span>
          </AppButton>
        </div>

        {adminCharacters.error && !isCreateModalOpen && !characterToEdit && (
          <AppCard>
            <p role="alert" className="text-[var(--danger)]">
              {adminCharacters.error}
            </p>
          </AppCard>
        )}

        {adminCharacters.successMessage && (
          <AppCard>
            <p role="status" className="text-[var(--primary)]">
              {adminCharacters.successMessage}
            </p>
          </AppCard>
        )}

        <AppCard>
          <label
            htmlFor="campaign"
            className="block text-sm font-bold text-[var(--text-main)]"
          >
            Campagna
          </label>

          <select
            id="campaign"
            value={adminCharacters.selectedCampaignId ?? ""}
            disabled={adminCharacters.isLoadingCampaigns}
            onChange={(event) => {
              const value = event.target.value
              adminCharacters.setSelectedCampaignId(
                value ? Number(value) : null,
              )
            }}
            className="mt-3 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
          >
            <option value="" disabled>
              {adminCharacters.isLoadingCampaigns
                ? "Caricamento campagne..."
                : "Seleziona una campagna"}
            </option>

            {adminCharacters.campaigns.map((campaign) => (
              <option key={campaign.id} value={campaign.id}>
                {campaign.name}
              </option>
            ))}
          </select>

          {adminCharacters.selectedCampaign && (
            <p className="mt-3 text-sm text-[var(--text-muted)]">
              Stai gestendo i personaggi di{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {adminCharacters.selectedCampaign.name}
              </span>
              .
            </p>
          )}
        </AppCard>

        {!adminCharacters.selectedCampaignId &&
          !adminCharacters.isLoadingCampaigns && (
            <AppCard>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
                  <FiUsers size={22} aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-[var(--text-main)]">
                    Seleziona una campagna
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    I personaggi sono collegati a una campagna. Prima scegli la
                    campagna, poi potrai crearli o modificarli.
                  </p>
                </div>
              </div>
            </AppCard>
          )}

        {adminCharacters.selectedCampaignId &&
          adminCharacters.isLoadingCharacters && (
            <AppCard>
              <p className="text-[var(--text-muted)]">
                Caricamento personaggi...
              </p>
            </AppCard>
          )}

        {adminCharacters.selectedCampaignId &&
          !adminCharacters.isLoadingCharacters &&
          adminCharacters.characters.length === 0 && (
            <AppCard>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
                  <FiUsers size={22} aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-[var(--text-main)]">
                    Nessun personaggio
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Questa campagna non ha ancora personaggi. Creane uno per
                    permettere ai player di sceglierlo.
                  </p>
                </div>
              </div>
            </AppCard>
          )}

        {adminCharacters.selectedCampaignId &&
          !adminCharacters.isLoadingCharacters &&
          adminCharacters.characters.length > 0 && (
            <div className="space-y-4">
              {adminCharacters.characters.map((character) => (
                <AdminCharacterCard
                  key={character.id}
                  character={character}
                  campaignName={adminCharacters.selectedCampaign?.name}
                  onEdit={openEditModal}
                  onDelete={openDeleteModal}
                />
              ))}
            </div>
          )}

        <CharacterFormModal
          isOpen={isCreateModalOpen}
          title="Nuovo personaggio"
          description="Crea un personaggio collegato alla campagna selezionata. I player potranno sceglierlo se non è già assegnato."
          values={characterForm.values}
          isSubmitting={adminCharacters.isCreating}
          submitLabel="Crea personaggio"
          onClose={closeCreateModal}
          onSubmit={handleCreateCharacter}
          onChange={characterForm.updateField}
          error={modalError}
        />
        <CharacterFormModal
          isOpen={characterToEdit !== null}
          title="Modifica personaggio"
          description="Aggiorna i dati del personaggio. Se scegli una nuova immagine, sostituirà quella precedente."
          values={characterForm.values}
          isSubmitting={adminCharacters.isUpdating}
          submitLabel="Salva modifiche"
          onClose={closeEditModal}
          onSubmit={handleUpdateCharacter}
          onChange={characterForm.updateField}
          error={modalError}
        />
        <AppModal
          isOpen={characterToDelete !== null}
          title="Eliminare personaggio?"
          description="Questa azione non può essere annullata."
          onClose={closeDeleteModal}
          size="sm"
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Vuoi davvero eliminare{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {characterToDelete?.name}
              </span>
              ?
            </p>

            <p className="rounded-xl bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm font-bold text-[var(--text-danger)]">
              Puoi eliminare solo personaggi non ancora scelti da un player.
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
                disabled={adminCharacters.isDeleting}
                onClick={handleDeleteCharacter}
              >
                {adminCharacters.isDeleting ? "Eliminazione..." : "Sì, elimina"}
              </AppButton>
            </div>
          </div>
        </AppModal>
      </section>
    </AppShell>
  )
}
