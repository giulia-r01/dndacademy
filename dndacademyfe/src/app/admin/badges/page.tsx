"use client"

import Link from "next/link"
import {
  FiArrowLeft,
  FiAward,
  FiEdit3,
  FiPlusCircle,
  FiTrash2,
} from "react-icons/fi"

import BadgeFormModal from "@/components/admin/badges/BadgeFormModal"
import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppModal from "@/components/common/AppModal"
import AppShell from "@/components/layout/AppShell"
import { useAdminBadges } from "@/hooks/useAdminBadges"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export default function AdminBadgesPage() {
  const { user, isLoading: isCheckingUser, error: userError } = useCurrentUser()

  const {
    badges,
    isCreateModalOpen,
    badgeToEdit,
    badgeToDelete,
    isLoadingBadges,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    successMessage,
    createBadge,
    updateBadge,
    deleteBadge,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    badgeBlockedByRelations,
    closeBlockedByRelationsModal,
  } = useAdminBadges()

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

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
              Backoffice
            </p>

            <h2 className="mt-2 text-3xl font-black text-[var(--text-main)]">
              Gestione badge
            </h2>

            <p className="mt-2 max-w-2xl text-[var(--text-soft)]">
              Crea e gestisci i badge che i player potranno sbloccare durante il
              percorso didattico.
            </p>
          </div>

          <AppButton type="button" onClick={openCreateModal}>
            <span className="inline-flex items-center gap-2">
              <FiPlusCircle aria-hidden="true" />
              Nuovo badge
            </span>
          </AppButton>
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

        {isLoadingBadges && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento badge...</p>
          </AppCard>
        )}

        {!isLoadingBadges && badges.length === 0 && (
          <AppCard>
            <p className="text-[var(--text-muted)]">
              Non ci sono ancora badge.
            </p>
          </AppCard>
        )}

        {!isLoadingBadges && badges.length > 0 && (
          <div className="grid gap-4 lg:grid-cols-2">
            {badges.map((badge) => (
              <AppCard key={badge.id}>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
                    <FiAward size={21} aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-lg font-black text-[var(--text-main)]">
                      {badge.name}
                    </h3>

                    <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                      {badge.description}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <AppButton
                        type="button"
                        variant="secondary"
                        onClick={() => openEditModal(badge)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <FiEdit3 aria-hidden="true" />
                          Modifica
                        </span>
                      </AppButton>

                      <AppButton
                        type="button"
                        variant="danger"
                        onClick={() => openDeleteModal(badge)}
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

        <BadgeFormModal
          isOpen={isCreateModalOpen}
          title="Nuovo badge"
          description="Crea una nuova ricompensa per i player."
          isSubmitting={isCreating}
          onClose={closeCreateModal}
          onSubmit={async (values) => {
            await createBadge(values)
            closeCreateModal()
          }}
        />

        <BadgeFormModal
          isOpen={badgeToEdit !== null}
          title="Modifica badge"
          description="Aggiorna nome e descrizione del badge."
          badgeToEdit={badgeToEdit}
          isSubmitting={isUpdating}
          onClose={closeEditModal}
          onSubmit={async (values) => {
            if (!badgeToEdit) {
              return
            }

            await updateBadge(badgeToEdit.id, values)
          }}
        />

        <AppModal
          isOpen={badgeToDelete !== null}
          title="Eliminazione badge"
          description="Questa azione non può essere annullata."
          onClose={closeDeleteModal}
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Vuoi davvero eliminare{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {badgeToDelete?.name}
              </span>
              ?
            </p>

            <p className="rounded-xl bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm font-bold text-[var(--danger)]">
              Puoi eliminare solo badge non assegnati agli utenti e non usati
              come ricompensa nei capitoli.
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
                onClick={deleteBadge}
              >
                {isDeleting ? "Eliminazione..." : "Sì, elimina"}
              </AppButton>
            </div>
          </div>
        </AppModal>
        <AppModal
          isOpen={badgeBlockedByRelations !== null}
          title="Badge non eliminabile"
          description="Questo badge è ancora collegato ad altri contenuti."
          onClose={closeBlockedByRelationsModal}
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Non puoi eliminare{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {badgeBlockedByRelations?.name}
              </span>{" "}
              perché è già stato assegnato a uno o più utenti oppure è usato
              come ricompensa in uno o più capitoli.
            </p>

            <p className="rounded-xl bg-[rgba(245,158,11,0.12)] px-4 py-3 text-sm font-bold text-[var(--accent-soft)]">
              Per eliminarlo, devi prima rimuovere tutti i collegamenti
              esistenti.
            </p>

            <div className="flex justify-end">
              <AppButton
                type="button"
                variant="secondary"
                onClick={closeBlockedByRelationsModal}
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
