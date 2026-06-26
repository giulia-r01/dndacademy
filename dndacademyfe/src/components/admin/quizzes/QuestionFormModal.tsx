"use client"

import { useState, type FormEvent } from "react"
import AppButton from "@/components/common/AppButton"
import AppModal from "@/components/common/AppModal"
import FormInput from "@/components/common/FormInput"
import type {
  AdminQuestion,
  CreateAnswerRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest,
} from "@/types/quiz"

type QuestionFormValues = CreateQuestionRequest | UpdateQuestionRequest

type QuestionAnswerFormState = {
  text: string
  correct: boolean
}

type QuestionFormState = {
  text: string
  answers: QuestionAnswerFormState[]
}

type QuestionFormModalProps = {
  isOpen: boolean
  title: string
  description: string
  quizId?: number | null
  questionToEdit?: AdminQuestion | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: QuestionFormValues) => Promise<void>
}

function getInitialFormState(
  questionToEdit?: AdminQuestion | null,
): QuestionFormState {
  if (questionToEdit) {
    return {
      text: questionToEdit.text,
      answers: [],
    }
  }

  return {
    text: "",
    answers: [
      { text: "", correct: true },
      { text: "", correct: false },
    ],
  }
}

export default function QuestionFormModal({
  isOpen,
  title,
  description,
  quizId,
  questionToEdit,
  isSubmitting,
  onClose,
  onSubmit,
}: QuestionFormModalProps) {
  const [formValues, setFormValues] = useState<QuestionFormState>(() =>
    getInitialFormState(questionToEdit),
  )
  const [formError, setFormError] = useState("")

  const isEditMode = Boolean(questionToEdit)

  function updateAnswerText(index: number, value: string) {
    setFormValues((current) => ({
      ...current,
      answers: current.answers.map((answer, answerIndex) =>
        answerIndex === index ? { ...answer, text: value } : answer,
      ),
    }))
  }

  function toggleCorrectAnswer(index: number) {
    setFormValues((current) => ({
      ...current,
      answers: current.answers.map((answer, answerIndex) =>
        answerIndex === index
          ? { ...answer, correct: !answer.correct }
          : answer,
      ),
    }))
  }

  function addAnswer() {
    setFormValues((current) => ({
      ...current,
      answers: [...current.answers, { text: "", correct: false }],
    }))
  }

  function removeAnswer(index: number) {
    setFormValues((current) => ({
      ...current,
      answers: current.answers.filter(
        (_, answerIndex) => answerIndex !== index,
      ),
    }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setFormError("")

    if (!formValues.text.trim()) {
      setFormError("Il testo della domanda è obbligatorio.")
      return
    }

    if (isEditMode) {
      await onSubmit({
        text: formValues.text.trim(),
      })

      return
    }

    if (!quizId) {
      setFormError("Quiz non valido.")
      return
    }

    const cleanedAnswers: CreateAnswerRequest[] = formValues.answers.map(
      (answer) => ({
        text: answer.text.trim(),
        correct: answer.correct,
      }),
    )

    if (cleanedAnswers.length < 2) {
      setFormError("La domanda deve avere almeno due risposte.")
      return
    }

    if (cleanedAnswers.some((answer) => !answer.text)) {
      setFormError("Tutte le risposte devono avere un testo.")
      return
    }

    if (!cleanedAnswers.some((answer) => answer.correct)) {
      setFormError("Devi selezionare almeno una risposta corretta.")
      return
    }

    await onSubmit({
      quizId,
      text: formValues.text.trim(),
      answers: cleanedAnswers,
    })
  }

  const submitLabel = isEditMode ? "Salva modifiche" : "Crea domanda"
  const loadingLabel = isEditMode ? "Salvataggio..." : "Creazione..."

  return (
    <AppModal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onClose}
    >
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
          label="Testo domanda"
          name="questionText"
          type="text"
          placeholder="Es. Quale dado si usa per un tiro per colpire?"
          value={formValues.text}
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              text: event.target.value,
            }))
          }
        />

        {!isEditMode && (
          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-black text-[var(--text-main)]">
                Risposte
              </h4>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Inserisci almeno due risposte e seleziona almeno una risposta
                corretta.
              </p>
            </div>

            {formValues.answers.map((answer, index) => (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] p-4"
              >
                <FormInput
                  label={`Risposta ${index + 1}`}
                  name={`answer-${index}`}
                  type="text"
                  placeholder="Testo risposta"
                  value={answer.text}
                  onChange={(event) =>
                    updateAnswerText(index, event.target.value)
                  }
                />

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-soft)]">
                    <input
                      type="checkbox"
                      checked={answer.correct}
                      onChange={() => toggleCorrectAnswer(index)}
                    />
                    Risposta corretta
                  </label>

                  {formValues.answers.length > 2 && (
                    <AppButton
                      type="button"
                      variant="danger"
                      onClick={() => removeAnswer(index)}
                    >
                      Rimuovi
                    </AppButton>
                  )}
                </div>
              </div>
            ))}

            <AppButton type="button" variant="secondary" onClick={addAnswer}>
              Aggiungi risposta
            </AppButton>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AppButton type="button" variant="secondary" onClick={onClose}>
            Annulla
          </AppButton>

          <AppButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? loadingLabel : submitLabel}
          </AppButton>
        </div>
      </form>
    </AppModal>
  )
}
