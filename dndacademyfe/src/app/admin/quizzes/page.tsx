"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FiArrowLeft,
  FiCheckCircle,
  FiChevronDown,
  FiChevronUp,
  FiEdit3,
  FiHelpCircle,
  FiPlusCircle,
  FiTrash2,
  FiXCircle,
} from "react-icons/fi"

import AnswerFormModal from "@/components/admin/quizzes/AnswerFormModal"
import QuestionFormModal from "@/components/admin/quizzes/QuestionFormModal"
import QuizFormModal from "@/components/admin/quizzes/QuizFormModal"
import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppModal from "@/components/common/AppModal"
import AppShell from "@/components/layout/AppShell"
import { useAdminQuestions } from "@/hooks/useAdminQuestions"
import { useAdminQuizzes } from "@/hooks/useAdminQuizzes"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { lessonService } from "@/services/lesson.service"
import type { Lesson } from "@/types/lesson"

export default function AdminQuizzesPage() {
  const { user, isLoading: isCheckingUser, error: userError } = useCurrentUser()

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [isLoadingLessons, setIsLoadingLessons] = useState(true)
  const [lessonsError, setLessonsError] = useState("")

  const {
    quizzes,
    questionsByQuizId,
    setQuestionsByQuizId,
    expandedQuizId,
    isCreateModalOpen,
    quizToEdit,
    quizToDelete,
    quizBlockedByRelations,
    isLoadingQuizzes,
    loadingQuestionsQuizId,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    successMessage,
    toggleQuizAccordion,
    refreshQuiz,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    closeBlockedByRelationsModal,
  } = useAdminQuizzes()

  const {
    questionToEdit,
    questionToDelete,
    answerToEdit,
    answerToDelete,
    selectedQuizId,
    isQuestionCreateModalOpen,
    isCreatingQuestion,
    isUpdatingQuestion,
    isDeletingQuestion,
    isUpdatingAnswer,
    isDeletingAnswer,
    isEditingOnlyCorrectAnswer,
    questionError,
    questionSuccessMessage,
    openCreateQuestionModal,
    closeCreateQuestionModal,
    openEditQuestionModal,
    closeEditQuestionModal,
    openDeleteQuestionModal,
    closeDeleteQuestionModal,
    openEditAnswerModal,
    closeEditAnswerModal,
    openDeleteAnswerModal,
    closeDeleteAnswerModal,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    updateAnswer,
    deleteAnswer,
  } = useAdminQuestions({
    questionsByQuizId,
    setQuestionsByQuizId,
    refreshQuiz,
  })

  useEffect(() => {
    let isMounted = true

    async function loadLessons() {
      try {
        const data = await lessonService.getAll()

        if (!isMounted) {
          return
        }

        setLessons([...data].sort((a, b) => a.orderIndex - b.orderIndex))
      } catch (err) {
        if (!isMounted) {
          return
        }

        const message =
          err instanceof Error ? err.message : "Errore nel caricamento lezioni"

        setLessonsError(message)
      } finally {
        if (isMounted) {
          setIsLoadingLessons(false)
        }
      }
    }

    void loadLessons()

    return () => {
      isMounted = false
    }
  }, [])

  const usedLessonIds = quizzes.map((quiz) => quiz.lessonId)

  const availableLessonsForCreate = lessons.filter(
    (lesson) => !usedLessonIds.includes(lesson.id),
  )

  const availableLessonsForEdit = quizToEdit
    ? lessons.filter(
        (lesson) =>
          lesson.id === quizToEdit.lessonId ||
          !usedLessonIds.includes(lesson.id),
      )
    : []

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
              Gestione quiz
            </h2>

            <p className="mt-2 max-w-2xl text-[var(--text-soft)]">
              Crea e gestisci quiz, domande e risposte collegati alle lezioni.
            </p>
          </div>

          <AppButton
            type="button"
            onClick={openCreateModal}
            disabled={
              isLoadingLessons ||
              lessons.length === 0 ||
              availableLessonsForCreate.length === 0
            }
          >
            <span className="inline-flex items-center gap-2">
              <FiPlusCircle aria-hidden="true" />
              Nuovo quiz
            </span>
          </AppButton>
        </div>

        {(error || lessonsError || questionError) && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {error || lessonsError || questionError}
            </p>
          </AppCard>
        )}

        {(successMessage || questionSuccessMessage) && (
          <AppCard>
            <p role="status" className="text-[var(--primary)]">
              {successMessage || questionSuccessMessage}
            </p>
          </AppCard>
        )}

        {(isLoadingQuizzes || isLoadingLessons) && (
          <AppCard>
            <p className="text-[var(--text-muted)]">
              Caricamento quiz e lezioni...
            </p>
          </AppCard>
        )}

        {!isLoadingQuizzes && !isLoadingLessons && lessons.length === 0 && (
          <AppCard>
            <p className="text-[var(--text-muted)]">
              Prima di creare un quiz devi creare almeno una lezione.
            </p>
          </AppCard>
        )}

        {!isLoadingQuizzes &&
          !isLoadingLessons &&
          lessons.length > 0 &&
          quizzes.length === 0 && (
            <AppCard>
              <p className="text-[var(--text-muted)]">
                Non ci sono ancora quiz.
              </p>
            </AppCard>
          )}

        {!isLoadingQuizzes &&
          !isLoadingLessons &&
          quizzes.length > 0 &&
          availableLessonsForCreate.length === 0 && (
            <AppCard>
              <p className="text-[var(--text-muted)]">
                Tutte le lezioni hanno già un quiz associato.
              </p>
            </AppCard>
          )}

        {!isLoadingQuizzes && !isLoadingLessons && quizzes.length > 0 && (
          <div className="space-y-4">
            {quizzes.map((quiz) => {
              const isExpanded = expandedQuizId === quiz.id
              const questions = questionsByQuizId[quiz.id] ?? []

              return (
                <AppCard key={quiz.id}>
                  <div className="space-y-5">
                    <div className="flex items-start gap-4">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
                        <FiHelpCircle size={21} aria-hidden="true" />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-lg font-black text-[var(--text-main)]">
                          {quiz.title}
                        </h3>

                        <p className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-soft)]">
                          Lezione: {quiz.lessonTitle} · Soglia:{" "}
                          {quiz.passingScore}% · Domande: {quiz.questionCount}
                        </p>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <AppButton
                            type="button"
                            variant="secondary"
                            onClick={() => toggleQuizAccordion(quiz.id)}
                          >
                            <span className="inline-flex items-center gap-2">
                              {isExpanded ? (
                                <FiChevronUp aria-hidden="true" />
                              ) : (
                                <FiChevronDown aria-hidden="true" />
                              )}
                              {isExpanded ? "Chiudi" : "Domande"}
                            </span>
                          </AppButton>

                          <AppButton
                            type="button"
                            variant="secondary"
                            onClick={() => openEditModal(quiz)}
                          >
                            <span className="inline-flex items-center gap-2">
                              <FiEdit3 aria-hidden="true" />
                              Modifica
                            </span>
                          </AppButton>

                          <AppButton
                            type="button"
                            variant="danger"
                            onClick={() => openDeleteModal(quiz)}
                          >
                            <span className="inline-flex items-center gap-2">
                              <FiTrash2 aria-hidden="true" />
                              Elimina
                            </span>
                          </AppButton>
                        </div>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] p-4">
                        <div className="mb-4 flex items-center justify-between gap-3">
                          <h4 className="text-md font-bold text-[var(--text-main)] ms-1">
                            Domande del quiz
                          </h4>

                          <AppButton
                            type="button"
                            variant="secondary"
                            onClick={() => openCreateQuestionModal(quiz.id)}
                          >
                            <span className="inline-flex items-center gap-2">
                              <FiPlusCircle aria-hidden="true" />
                              Nuova domanda
                            </span>
                          </AppButton>
                        </div>

                        {loadingQuestionsQuizId === quiz.id && (
                          <p className="text-sm text-[var(--text-muted)]">
                            Caricamento domande...
                          </p>
                        )}

                        {loadingQuestionsQuizId !== quiz.id &&
                          questions.length === 0 && (
                            <p className="text-sm text-[var(--text-muted)]">
                              Questo quiz non ha ancora domande.
                            </p>
                          )}

                        {loadingQuestionsQuizId !== quiz.id &&
                          questions.length > 0 && (
                            <div className="space-y-4">
                              {questions.map((question) => (
                                <div
                                  key={question.id}
                                  className="rounded-xl bg-[var(--surface)] p-4"
                                >
                                  <p className="font-bold text-[var(--text-main)]">
                                    {question.text}
                                  </p>

                                  <ul className="mt-3 space-y-2">
                                    {question.answers.map((answer) => (
                                      <li
                                        key={answer.id}
                                        className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-[var(--surface-muted)] px-3 py-2 text-sm text-[var(--text-muted)]"
                                      >
                                        <span className="inline-flex items-center gap-2">
                                          {answer.correct ? (
                                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-[var(--bg-app-deep)]">
                                              <FiCheckCircle
                                                size={18}
                                                aria-hidden="true"
                                              />
                                            </span>
                                          ) : (
                                            <FiXCircle
                                              className="text-[var(--danger)]"
                                              size={16}
                                              aria-hidden="true"
                                            />
                                          )}
                                          {answer.text}
                                        </span>

                                        <span className="flex flex-wrap gap-2">
                                          <AppButton
                                            type="button"
                                            variant="secondary"
                                            onClick={() =>
                                              openEditAnswerModal(
                                                answer,
                                                question,
                                                quiz.id,
                                              )
                                            }
                                          >
                                            Modifica
                                          </AppButton>

                                          <AppButton
                                            type="button"
                                            variant="danger"
                                            onClick={() =>
                                              openDeleteAnswerModal(
                                                answer,
                                                question.id,
                                                quiz.id,
                                              )
                                            }
                                          >
                                            Elimina
                                          </AppButton>
                                        </span>
                                      </li>
                                    ))}
                                  </ul>

                                  <div className="mt-4 flex flex-wrap gap-3">
                                    <AppButton
                                      type="button"
                                      variant="secondary"
                                      onClick={() =>
                                        openEditQuestionModal(question, quiz.id)
                                      }
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        <FiEdit3 aria-hidden="true" />
                                        Modifica domanda
                                      </span>
                                    </AppButton>

                                    <AppButton
                                      type="button"
                                      variant="danger"
                                      onClick={() =>
                                        openDeleteQuestionModal(
                                          question,
                                          quiz.id,
                                        )
                                      }
                                    >
                                      <span className="inline-flex items-center gap-2">
                                        <FiTrash2 aria-hidden="true" />
                                        Elimina domanda
                                      </span>
                                    </AppButton>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                      </div>
                    )}
                  </div>
                </AppCard>
              )
            })}
          </div>
        )}

        <QuizFormModal
          isOpen={isCreateModalOpen}
          title="Nuovo quiz"
          description="Crea un quiz collegato a una lezione."
          lessons={availableLessonsForCreate}
          isSubmitting={isCreating}
          onClose={closeCreateModal}
          onSubmit={createQuiz}
        />

        <QuizFormModal
          isOpen={quizToEdit !== null}
          title="Modifica quiz"
          description="Aggiorna titolo, lezione collegata e soglia di superamento."
          quizToEdit={quizToEdit}
          lessons={availableLessonsForEdit}
          isSubmitting={isUpdating}
          onClose={closeEditModal}
          onSubmit={async (values) => {
            if (!quizToEdit) {
              return
            }

            await updateQuiz(quizToEdit.id, values)
          }}
        />

        <QuestionFormModal
          key={selectedQuizId ?? "new-question"}
          isOpen={isQuestionCreateModalOpen}
          title="Nuova domanda"
          description="Crea una domanda con almeno due risposte."
          quizId={selectedQuizId}
          isSubmitting={isCreatingQuestion}
          onClose={closeCreateQuestionModal}
          onSubmit={async (values) => {
            if (!("quizId" in values) || !("answers" in values)) {
              return
            }

            await createQuestion(values)
          }}
        />

        <QuestionFormModal
          key={questionToEdit?.id ?? "edit-question"}
          isOpen={questionToEdit !== null}
          title="Modifica domanda"
          description="Aggiorna il testo della domanda."
          questionToEdit={questionToEdit}
          isSubmitting={isUpdatingQuestion}
          onClose={closeEditQuestionModal}
          onSubmit={async (values) => {
            if (!questionToEdit || !("text" in values)) {
              return
            }

            await updateQuestion(questionToEdit.id, {
              text: values.text,
            })
          }}
        />

        <AnswerFormModal
          key={answerToEdit?.id ?? "edit-answer"}
          isOpen={answerToEdit !== null}
          title="Modifica risposta"
          description="Aggiorna testo e correttezza della risposta."
          answerToEdit={answerToEdit}
          isSubmitting={isUpdatingAnswer}
          disableCorrectToggle={isEditingOnlyCorrectAnswer}
          onClose={closeEditAnswerModal}
          onSubmit={async (values) => {
            if (!answerToEdit) {
              return
            }

            await updateAnswer(answerToEdit.id, values)
          }}
        />

        <AppModal
          isOpen={answerToDelete !== null}
          title="Eliminazione risposta"
          description="Questa azione non può essere annullata."
          onClose={closeDeleteAnswerModal}
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Vuoi davvero eliminare{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {answerToDelete?.text}
              </span>
              ?
            </p>

            <p className="rounded-xl bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm font-bold text-[var(--danger)]">
              La domanda deve mantenere almeno due risposte e almeno una
              risposta corretta.
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <AppButton
                type="button"
                variant="secondary"
                onClick={closeDeleteAnswerModal}
              >
                No, annulla
              </AppButton>

              <AppButton
                type="button"
                variant="danger"
                disabled={isDeletingAnswer}
                onClick={deleteAnswer}
              >
                {isDeletingAnswer ? "Eliminazione..." : "Sì, elimina"}
              </AppButton>
            </div>
          </div>
        </AppModal>

        <AppModal
          isOpen={questionToDelete !== null}
          title="Eliminazione domanda"
          description="Questa azione eliminerà anche tutte le risposte collegate."
          onClose={closeDeleteQuestionModal}
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Vuoi davvero eliminare questa domanda?
            </p>

            <p className="rounded-xl bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm font-bold text-[var(--danger)]">
              Verranno eliminate anche tutte le risposte associate.
            </p>

            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <AppButton
                type="button"
                variant="secondary"
                onClick={closeDeleteQuestionModal}
              >
                No, annulla
              </AppButton>

              <AppButton
                type="button"
                variant="danger"
                disabled={isDeletingQuestion}
                onClick={deleteQuestion}
              >
                {isDeletingQuestion ? "Eliminazione..." : "Sì, elimina"}
              </AppButton>
            </div>
          </div>
        </AppModal>

        <AppModal
          isOpen={quizToDelete !== null}
          title="Eliminazione quiz"
          description="Questa azione non può essere annullata."
          onClose={closeDeleteModal}
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Vuoi davvero eliminare{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {quizToDelete?.title}
              </span>
              ?
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
                onClick={deleteQuiz}
              >
                {isDeleting ? "Eliminazione..." : "Sì, elimina"}
              </AppButton>
            </div>
          </div>
        </AppModal>

        <AppModal
          isOpen={quizBlockedByRelations !== null}
          title="Quiz non eliminabile"
          description="Questo quiz è ancora collegato ad altri contenuti."
          onClose={closeBlockedByRelationsModal}
        >
          <div className="space-y-5">
            <p className="text-sm leading-6 text-[var(--text-soft)]">
              Non puoi eliminare{" "}
              <span className="font-bold text-[var(--accent-soft)]">
                {quizBlockedByRelations?.title}
              </span>{" "}
              perché contiene domande, è già stato svolto da utenti oppure è
              collegato a uno o più capitoli.
            </p>

            <p className="rounded-xl bg-[rgba(245,158,11,0.12)] px-4 py-3 text-sm font-bold text-[var(--accent-soft)]">
              Per eliminarlo, devi prima rimuovere tutte le domande e tutti i
              collegamenti esistenti.
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
