"use client"

import { type FormEvent, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  FiArrowLeft,
  FiBookOpen,
  FiEdit3,
  FiPlusCircle,
  FiTrash2,
} from "react-icons/fi"

import CampaignChapterFormModal from "@/components/campaigns/CampaignChapterFormModal"
import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppModal from "@/components/common/AppModal"
import AppShell from "@/components/layout/AppShell"
import { useAdminCampaignChapters } from "@/hooks/useAdminCampaignChapters"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import type { CampaignChapter } from "@/types/campaign-chapter"

export default function AdminCampaignChaptersPage() {
  const params = useParams<{ campaignId: string }>()
  const campaignId = Number(params.campaignId)

  const { user, isLoading: isCheckingUser, error: userError } = useCurrentUser()
  const adminChapters = useAdminCampaignChapters(campaignId)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [chapterToEdit, setChapterToEdit] = useState<CampaignChapter | null>(
    null,
  )
  const [chapterToDelete, setChapterToDelete] =
    useState<CampaignChapter | null>(null)

  const campaignName =
    adminChapters.chapters[0]?.campaignName ?? `Campagna #${campaignId}`

  function openCreateModal() {
    adminChapters.prepareCreateForm()
    setIsCreateModalOpen(true)
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false)
    adminChapters.resetForm()
  }

  async function handleCreateChapter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const wasCreated = await adminChapters.createChapter()

    if (wasCreated) {
      closeCreateModal()
    }
  }

  function openEditModal(chapter: CampaignChapter) {
    adminChapters.fillFormFromChapter(chapter)
    setChapterToEdit(chapter)
  }

  function closeEditModal() {
    setChapterToEdit(null)
    adminChapters.resetForm()
  }

  async function handleUpdateChapter(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!chapterToEdit) {
      return
    }

    const wasUpdated = await adminChapters.updateChapter(chapterToEdit.id)

    if (wasUpdated) {
      closeEditModal()
    }
  }

  function openDeleteModal(chapter: CampaignChapter) {
    adminChapters.setError("")
    adminChapters.setSuccessMessage("")
    setChapterToDelete(chapter)
  }

  function closeDeleteModal() {
    setChapterToDelete(null)
  }

  async function handleDeleteChapter() {
    if (!chapterToDelete) {
      return
    }

    const wasDeleted = await adminChapters.deleteChapter(chapterToDelete.id)

    if (wasDeleted) {
      closeDeleteModal()
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

  if (userError || user?.role !== "MASTER") {
    return (
      <AppShell>
        <AppCard className="border-danger">
          <p role="alert" className="text-danger">
            {userError ?? "Accesso riservato agli utenti Master."}
          </p>
        </AppCard>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <Link
          href="/admin/campaigns"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-soft)] transition hover:text-[var(--accent-soft)]"
        >
          <FiArrowLeft aria-hidden="true" />
          Torna alle campagne
        </Link>

        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
              Backoffice campagna
            </p>

            <h2 className="mt-2 text-3xl font-black text-[var(--text-main)]">
              Capitoli di {campaignName}
            </h2>

            <p className="mt-2 max-w-3xl text-[var(--text-soft)]">
              Gestisci la struttura narrativa della campagna: storia, lezioni,
              quiz, combattimenti e badge.
            </p>
          </div>

          <AppButton
            type="button"
            disabled={adminChapters.isLoadingOptions}
            onClick={openCreateModal}
          >
            <span className="inline-flex items-center gap-2">
              <FiPlusCircle aria-hidden="true" />
              Nuovo capitolo
            </span>
          </AppButton>
        </div>

        {adminChapters.error && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {adminChapters.error}
            </p>
          </AppCard>
        )}

        {adminChapters.successMessage && (
          <AppCard>
            <p role="status" className="text-[var(--primary)]">
              {adminChapters.successMessage}
            </p>
          </AppCard>
        )}

        {adminChapters.isLoadingChapters && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento capitoli...</p>
          </AppCard>
        )}

        {!adminChapters.isLoadingChapters &&
          !adminChapters.error &&
          adminChapters.chapters.length === 0 && (
            <AppCard>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
                  <FiBookOpen size={22} aria-hidden="true" />
                </div>

                <div>
                  <h3 className="text-xl font-black text-[var(--text-main)]">
                    Nessun capitolo
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Questa campagna non ha ancora capitoli. Creane uno per
                    iniziare a costruire il percorso narrativo.
                  </p>
                </div>
              </div>
            </AppCard>
          )}

        {!adminChapters.isLoadingChapters &&
          adminChapters.chapters.length > 0 && (
            <div className="space-y-4">
              {adminChapters.chapters.map((chapter) => (
                <AppCard key={chapter.id}>
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="w-fit rounded-full border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-soft)]">
                        Capitolo {chapter.orderIndex}
                      </p>

                      <h3 className="mt-4 text-2xl font-black text-[var(--text-main)]">
                        {chapter.title}
                      </h3>

                      <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
                        {chapter.description || "Nessuna descrizione."}
                      </p>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {chapter.lessonId && <ChapterTag label="Lezione" />}
                        {chapter.quizId && <ChapterTag label="Quiz" />}
                        {chapter.hasCombat && <ChapterTag label="Combat" />}
                        {chapter.rewardBadgeId && <ChapterTag label="Badge" />}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                      <AppButton
                        type="button"
                        variant="secondary"
                        onClick={() => openEditModal(chapter)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <FiEdit3 aria-hidden="true" />
                          Modifica
                        </span>
                      </AppButton>

                      <AppButton
                        type="button"
                        variant="danger"
                        onClick={() => openDeleteModal(chapter)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <FiTrash2 aria-hidden="true" />
                          Elimina
                        </span>
                      </AppButton>
                    </div>
                  </div>
                </AppCard>
              ))}
            </div>
          )}

        <CampaignChapterFormModal
          isOpen={isCreateModalOpen}
          title="Nuovo capitolo"
          description="Crea un capitolo narrativo collegato alla campagna selezionata."
          values={adminChapters.formValues}
          lessons={adminChapters.lessons}
          selectedQuiz={adminChapters.selectedQuiz}
          badges={adminChapters.badges}
          isLoadingQuiz={adminChapters.isLoadingQuiz}
          isSubmitting={adminChapters.isCreating}
          submitLabel="Crea capitolo"
          error={adminChapters.modalError}
          onClose={closeCreateModal}
          onSubmit={handleCreateChapter}
          onChange={adminChapters.updateFormField}
        />

        <CampaignChapterFormModal
          isOpen={chapterToEdit !== null}
          title="Modifica capitolo"
          description="Aggiorna storia, requisiti e ricompensa del capitolo."
          values={adminChapters.formValues}
          lessons={adminChapters.lessons}
          selectedQuiz={adminChapters.selectedQuiz}
          badges={adminChapters.badges}
          isLoadingQuiz={adminChapters.isLoadingQuiz}
          isSubmitting={adminChapters.isUpdating}
          submitLabel="Salva modifiche"
          error={adminChapters.modalError}
          onClose={closeEditModal}
          onSubmit={handleUpdateChapter}
          onChange={adminChapters.updateFormField}
        />

        <AppModal
          isOpen={chapterToDelete !== null}
          title="Vuoi eliminare il capitolo?"
          description="Questa azione non può essere annullata."
          onClose={closeDeleteModal}
          size="sm"
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Vuoi davvero eliminare{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {chapterToDelete?.title}
              </span>
              ?
            </p>

            <p className="rounded-xl bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm font-bold text-[var(--text-danger)]">
              Elimina un capitolo solo se non è già parte di un percorso player
              in uso.
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
                disabled={adminChapters.isDeleting}
                onClick={handleDeleteChapter}
              >
                {adminChapters.isDeleting ? "Eliminazione..." : "Sì, elimina"}
              </AppButton>
            </div>
          </div>
        </AppModal>
      </section>
    </AppShell>
  )
}

function ChapterTag({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold text-[var(--accent-soft)]">
      {label}
    </span>
  )
}
