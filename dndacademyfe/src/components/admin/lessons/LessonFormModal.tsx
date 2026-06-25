"use client"

import { useState, type FormEvent } from "react"
import AppButton from "@/components/common/AppButton"
import AppModal from "@/components/common/AppModal"
import FormInput from "@/components/common/FormInput"
import type {
  CreateLessonRequest,
  Lesson,
  UpdateLessonRequest,
} from "@/types/lesson"

type LessonFormValues = CreateLessonRequest | UpdateLessonRequest

type LessonFormState = {
  lessonTitle: string
  content: string
  orderIndex: string
  unlockedByDefault: boolean
}

type LessonFormModalProps = {
  isOpen: boolean
  title: string
  description: string
  lessonToEdit?: Lesson | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: LessonFormValues) => Promise<void>
}

type LessonFormContentProps = {
  lessonToEdit?: Lesson | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: LessonFormValues) => Promise<void>
}

function getInitialFormState(lessonToEdit?: Lesson | null): LessonFormState {
  if (!lessonToEdit) {
    return {
      lessonTitle: "",
      content: "",
      orderIndex: "",
      unlockedByDefault: false,
    }
  }

  return {
    lessonTitle: lessonToEdit.title,
    content: lessonToEdit.content,
    orderIndex: String(lessonToEdit.orderIndex),
    unlockedByDefault: lessonToEdit.unlockedByDefault,
  }
}

function LessonFormContent({
  lessonToEdit,
  isSubmitting,
  onClose,
  onSubmit,
}: LessonFormContentProps) {
  const [formValues, setFormValues] = useState<LessonFormState>(() =>
    getInitialFormState(lessonToEdit),
  )
  const [formError, setFormError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setFormError("")

    if (!formValues.lessonTitle.trim()) {
      setFormError("Il titolo della lezione è obbligatorio.")
      return
    }

    if (!formValues.content.trim()) {
      setFormError("Il contenuto della lezione è obbligatorio.")
      return
    }

    const parsedOrderIndex = Number(formValues.orderIndex)

    if (!Number.isInteger(parsedOrderIndex) || parsedOrderIndex < 1) {
      setFormError("L'ordine deve essere un numero intero maggiore di 0.")
      return
    }

    await onSubmit({
      title: formValues.lessonTitle.trim(),
      content: formValues.content.trim(),
      orderIndex: parsedOrderIndex,
      unlockedByDefault: formValues.unlockedByDefault,
    })
  }

  const submitLabel = lessonToEdit ? "Salva modifiche" : "Crea lezione"
  const loadingLabel = lessonToEdit ? "Salvataggio..." : "Creazione..."

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
        label="Titolo lezione"
        name="lessonTitle"
        type="text"
        placeholder="Es. Cos'e un tiro salvezza?"
        value={formValues.lessonTitle}
        onChange={(event) =>
          setFormValues((current) => ({
            ...current,
            lessonTitle: event.target.value,
          }))
        }
      />

      <div className="space-y-2">
        <label
          htmlFor="lessonContent"
          className="block text-sm font-bold text-[var(--text-main)]"
        >
          Contenuto
        </label>

        <textarea
          id="lessonContent"
          name="lessonContent"
          rows={10}
          placeholder="Scrivi il contenuto didattico della lezione."
          value={formValues.content}
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              content: event.target.value,
            }))
          }
          className="w-full resize-none rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        />
      </div>

      <FormInput
        label="Ordine"
        name="orderIndex"
        type="number"
        placeholder="Es. 1"
        value={formValues.orderIndex}
        onChange={(event) =>
          setFormValues((current) => ({
            ...current,
            orderIndex: event.target.value,
          }))
        }
      />

      <label className="flex items-start gap-3 rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] p-4">
        <input
          type="checkbox"
          checked={formValues.unlockedByDefault}
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              unlockedByDefault: event.target.checked,
            }))
          }
          className="mt-1 h-4 w-4 rounded border-[var(--border-teal-soft)]"
        />

        <span>
          <span className="block text-sm font-bold text-[var(--text-main)]">
            Sbloccata di default
          </span>

          <span className="mt-1 block text-sm text-[var(--text-muted)]">
            Se attiva, la lezione sara disponibile subito per i player.
          </span>
        </span>
      </label>

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

export default function LessonFormModal({
  isOpen,
  title,
  description,
  lessonToEdit,
  isSubmitting,
  onClose,
  onSubmit,
}: LessonFormModalProps) {
  const formKey = lessonToEdit?.id ?? "new"

  return (
    <AppModal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onClose}
    >
      <LessonFormContent
        key={formKey}
        lessonToEdit={lessonToEdit}
        isSubmitting={isSubmitting}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AppModal>
  )
}
