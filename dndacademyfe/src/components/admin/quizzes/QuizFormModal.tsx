"use client"

import { useState, type FormEvent } from "react"
import AppButton from "@/components/common/AppButton"
import AppModal from "@/components/common/AppModal"
import FormInput from "@/components/common/FormInput"
import type { Lesson } from "@/types/lesson"
import type { CreateQuizRequest, Quiz, UpdateQuizRequest } from "@/types/quiz"

type QuizFormValues = CreateQuizRequest | UpdateQuizRequest

type QuizFormState = {
  title: string
  lessonId: string
  passingScore: string
}

type QuizFormModalProps = {
  isOpen: boolean
  title: string
  description: string
  quizToEdit?: Quiz | null
  lessons: Lesson[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: QuizFormValues) => Promise<void>
}

type QuizFormContentProps = {
  quizToEdit?: Quiz | null
  lessons: Lesson[]
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: QuizFormValues) => Promise<void>
}

function getInitialFormState(quizToEdit?: Quiz | null): QuizFormState {
  if (!quizToEdit) {
    return {
      title: "",
      lessonId: "",
      passingScore: "70",
    }
  }

  return {
    title: quizToEdit.title,
    lessonId: String(quizToEdit.lessonId),
    passingScore: String(quizToEdit.passingScore),
  }
}

function QuizFormContent({
  quizToEdit,
  lessons,
  isSubmitting,
  onClose,
  onSubmit,
}: QuizFormContentProps) {
  const [formValues, setFormValues] = useState<QuizFormState>(() =>
    getInitialFormState(quizToEdit),
  )
  const [formError, setFormError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setFormError("")

    if (!formValues.title.trim()) {
      setFormError("Il titolo del quiz è obbligatorio.")
      return
    }

    const parsedLessonId = Number(formValues.lessonId)

    if (!Number.isInteger(parsedLessonId) || parsedLessonId < 1) {
      setFormError(
        "Devi selezionare una lezione. Se non ci sono lezioni disponibili, crea prima una lezione.",
      )
      return
    }

    const parsedPassingScore = Number(formValues.passingScore)

    if (
      !Number.isInteger(parsedPassingScore) ||
      parsedPassingScore < 1 ||
      parsedPassingScore > 100
    ) {
      setFormError("Il punteggio minimo deve essere compreso tra 1 e 100.")
      return
    }

    await onSubmit({
      title: formValues.title.trim(),
      lessonId: parsedLessonId,
      passingScore: parsedPassingScore,
    })
  }

  const submitLabel = quizToEdit ? "Salva modifiche" : "Crea quiz"
  const loadingLabel = quizToEdit ? "Salvataggio..." : "Creazione..."

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {formError && (
        <p
          role="alert"
          className="rounded-xl bg-[rgba(239,68,68,0.12)] px-4 py-3 text-sm font-bold text-[var(--danger)]"
        >
          {formError}
        </p>
      )}

      <FormInput
        label="Titolo quiz"
        name="quizTitle"
        type="text"
        placeholder="Es. Quiz sui tiri di caratteristica"
        value={formValues.title}
        onChange={(event) =>
          setFormValues((current) => ({
            ...current,
            title: event.target.value,
          }))
        }
      />

      <div className="space-y-2">
        <label
          htmlFor="lessonId"
          className="block text-sm font-bold text-[var(--text-main)]"
        >
          Lezione collegata
        </label>

        <select
          id="lessonId"
          value={formValues.lessonId}
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              lessonId: event.target.value,
            }))
          }
          className="w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        >
          <option value="">Seleziona una lezione</option>

          {lessons.map((lesson) => (
            <option key={lesson.id} value={lesson.id}>
              {lesson.orderIndex} - {lesson.title}
            </option>
          ))}
        </select>
      </div>

      <FormInput
        label="Punteggio minimo"
        name="passingScore"
        type="number"
        placeholder="Es. 70"
        value={formValues.passingScore}
        onChange={(event) =>
          setFormValues((current) => ({
            ...current,
            passingScore: event.target.value,
          }))
        }
      />

      <p className="text-sm leading-6 text-[var(--text-muted)]">
        Il punteggio minimo indica la percentuale necessaria per superare il
        quiz.
      </p>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <AppButton type="button" variant="secondary" onClick={onClose}>
          Annulla
        </AppButton>

        <AppButton type="submit" disabled={isSubmitting}>
          {isSubmitting ? loadingLabel : submitLabel}
        </AppButton>
      </div>
    </form>
  )
}

export default function QuizFormModal({
  isOpen,
  title,
  description,
  quizToEdit,
  lessons,
  isSubmitting,
  onClose,
  onSubmit,
}: QuizFormModalProps) {
  const formKey = quizToEdit?.id ?? "new"

  return (
    <AppModal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onClose}
    >
      <QuizFormContent
        key={formKey}
        quizToEdit={quizToEdit}
        lessons={lessons}
        isSubmitting={isSubmitting}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AppModal>
  )
}
