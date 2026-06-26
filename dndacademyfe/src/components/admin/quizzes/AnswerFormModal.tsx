"use client"

import { useState, type FormEvent } from "react"
import AppButton from "@/components/common/AppButton"
import AppModal from "@/components/common/AppModal"
import FormInput from "@/components/common/FormInput"
import type { AdminAnswer, CreateAnswerRequest } from "@/types/quiz"

type AnswerFormModalProps = {
  isOpen: boolean
  title: string
  description: string
  answerToEdit?: AdminAnswer | null
  isSubmitting: boolean
  disableCorrectToggle?: boolean
  onClose: () => void
  onSubmit: (values: CreateAnswerRequest) => Promise<void>
}

export default function AnswerFormModal({
  isOpen,
  title,
  description,
  answerToEdit,
  isSubmitting,
  disableCorrectToggle = false,
  onClose,
  onSubmit,
}: AnswerFormModalProps) {
  const [text, setText] = useState(answerToEdit?.text ?? "")
  const [correct, setCorrect] = useState(answerToEdit?.correct ?? false)
  const [formError, setFormError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setFormError("")

    if (!text.trim()) {
      setFormError("Il testo della risposta è obbligatorio.")
      return
    }

    await onSubmit({
      text: text.trim(),
      correct,
    })
  }

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
          label="Testo risposta"
          name="answerText"
          type="text"
          placeholder="Es. Mago"
          value={text}
          onChange={(event) => setText(event.target.value)}
        />

        <label className="flex items-start gap-3 rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] p-4">
          <input
            type="checkbox"
            checked={correct}
            disabled={disableCorrectToggle}
            onChange={(event) => setCorrect(event.target.checked)}
            className="mt-1 h-4 w-4 rounded border-[var(--border-teal-soft)] disabled:cursor-not-allowed disabled:opacity-60"
          />

          <span>
            <span className="block text-sm font-bold text-[var(--text-main)]">
              Risposta corretta
            </span>

            <span className="mt-1 block text-sm text-[var(--text-muted)]">
              Se attiva, questa risposta sarà considerata corretta.
            </span>

            {disableCorrectToggle && (
              <span className="mt-2 block text-sm font-bold text-[var(--accent-soft)]">
                Questa è l&apos;unica risposta corretta. Prima imposta
                un&apos;altra risposta come corretta, poi potrai modificarla.
              </span>
            )}
          </span>
        </label>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AppButton type="button" variant="secondary" onClick={onClose}>
            Annulla
          </AppButton>

          <AppButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvataggio..." : "Salva risposta"}
          </AppButton>
        </div>
      </form>
    </AppModal>
  )
}
