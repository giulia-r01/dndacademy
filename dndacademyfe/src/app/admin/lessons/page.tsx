"use client"

import Link from "next/link"
import {
  FiArrowLeft,
  FiBookOpen,
  FiEdit3,
  FiPlusCircle,
  FiTrash2,
} from "react-icons/fi"
import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppModal from "@/components/common/AppModal"
import AppShell from "@/components/layout/AppShell"
import LessonFormModal from "@/components/admin/lessons/LessonFormModal"
import { useAdminLessons } from "@/hooks/useAdminLessons"
import { useCurrentUser } from "@/hooks/useCurrentUser"

export default function AdminLessonsPage() {
  const { user, isLoading: isCheckingUser, error: userError } = useCurrentUser()

  const {
    lessons,
    isLoadingLessons,
    isCreating,
    isUpdating,
    isDeleting,
    lessonToEdit,
    lessonToDelete,
    error,
    successMessage,
    createLesson,
    updateLesson,
    deleteLesson,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    isCreateModalOpen,
    lessonBlockedByRelations,
    openCreateModal,
    closeCreateModal,
    closeBlockedByRelationsModal,
  } = useAdminLessons()

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
              Gestione lezioni
            </h2>

            <p className="mt-2 max-w-2xl text-[var(--text-soft)]">
              Crea e gestisci i contenuti didattici che verranno collegati ai
              capitoli delle campagne.
            </p>
          </div>

          <AppButton type="button" onClick={openCreateModal}>
            <span className="inline-flex items-center gap-2">
              <FiPlusCircle aria-hidden="true" />
              Nuova lezione
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

        {isLoadingLessons && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento lezioni...</p>
          </AppCard>
        )}

        {!isLoadingLessons && lessons.length === 0 && (
          <AppCard>
            <p className="text-[var(--text-muted)]">
              Non ci sono ancora lezioni.
            </p>
          </AppCard>
        )}

        {!isLoadingLessons && lessons.length > 0 && (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <AppCard key={lesson.id}>
                <div className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
                    <FiBookOpen size={21} aria-hidden="true" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <h3 className="text-lg font-black text-[var(--text-main)]">
                          {lesson.title}
                        </h3>

                        <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-soft)]">
                          Ordine {lesson.orderIndex} ·{" "}
                          {lesson.unlockedByDefault
                            ? "Sbloccata di default"
                            : "Bloccata inizialmente"}
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-[var(--text-muted)]">
                      {lesson.content}
                    </p>

                    <div className="mt-5 flex flex-wrap gap-3">
                      <AppButton
                        type="button"
                        variant="secondary"
                        onClick={() => openEditModal(lesson)}
                      >
                        <span className="inline-flex items-center gap-2">
                          <FiEdit3 aria-hidden="true" />
                          Modifica
                        </span>
                      </AppButton>

                      <AppButton
                        type="button"
                        variant="danger"
                        onClick={() => openDeleteModal(lesson)}
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

        <LessonFormModal
          isOpen={isCreateModalOpen}
          title="Nuova lezione"
          description="Crea un nuovo contenuto didattico."
          isSubmitting={isCreating}
          onClose={closeCreateModal}
          onSubmit={async (values) => {
            await createLesson(values)
            closeCreateModal()
          }}
        />

        <LessonFormModal
          isOpen={lessonToEdit !== null}
          title="Modifica lezione"
          description="Aggiorna il contenuto didattico della lezione."
          lessonToEdit={lessonToEdit}
          isSubmitting={isUpdating}
          onClose={closeEditModal}
          onSubmit={async (values) => {
            if (!lessonToEdit) return
            await updateLesson(lessonToEdit.id, values)
          }}
        />

        <AppModal
          isOpen={lessonToDelete !== null}
          title="Eliminazione lezione"
          description="Questa azione non può essere annullata."
          onClose={closeDeleteModal}
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Vuoi davvero eliminare{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {lessonToDelete?.title}
              </span>
              ?
            </p>

            <p className="rounded-xl bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm font-bold text-[var(--danger)]">
              Puoi eliminare solo lezioni non collegate a quiz o capitoli.
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
                onClick={deleteLesson}
              >
                {isDeleting ? "Eliminazione..." : "Sì, elimina"}
              </AppButton>
            </div>
          </div>
        </AppModal>
        <AppModal
          isOpen={lessonBlockedByRelations !== null}
          title="Lezione non eliminabile"
          description="Questa lezione è ancora collegata ad altri contenuti."
          onClose={closeBlockedByRelationsModal}
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Non puoi eliminare{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {lessonBlockedByRelations?.title}
              </span>{" "}
              perché è ancora utilizzata da:
            </p>

            <div className="space-y-4 rounded-xl bg-[rgba(245,158,11,0.12)] px-4 py-4 text-sm text-[var(--accent-soft)]">
              {lessonBlockedByRelations?.quiz && (
                <div>
                  <p className="font-black">Quiz associato: </p>
                  <p className="mt-1 font-bold">
                    {lessonBlockedByRelations.quiz.title}
                  </p>
                </div>
              )}

              {(lessonBlockedByRelations?.chapters.length ?? 0) > 0 && (
                <div>
                  <p className="font-black">Capitoli collegati: </p>

                  <ul className="mt-2 list-disc space-y-1 pl-5 font-bold">
                    {lessonBlockedByRelations?.chapters.map((chapter) => (
                      <li key={chapter.id}>{chapter.title}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <p className="text-sm leading-6 text-[var(--text-muted)]">
              Prima elimina il quiz associato e rimuovi questa lezione dai
              capitoli delle campagne.
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
