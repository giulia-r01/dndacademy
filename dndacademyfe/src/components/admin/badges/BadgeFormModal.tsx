"use client"

import { useState, type FormEvent } from "react"
import AppButton from "@/components/common/AppButton"
import AppModal from "@/components/common/AppModal"
import FormInput from "@/components/common/FormInput"
import type {
  Badge,
  CreateBadgeRequest,
  UpdateBadgeRequest,
} from "@/types/badge"

type BadgeFormValues = CreateBadgeRequest | UpdateBadgeRequest

type BadgeFormState = {
  name: string
  description: string
}

type BadgeFormModalProps = {
  isOpen: boolean
  title: string
  description: string
  badgeToEdit?: Badge | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: BadgeFormValues) => Promise<void>
}

type BadgeFormContentProps = {
  badgeToEdit?: Badge | null
  isSubmitting: boolean
  onClose: () => void
  onSubmit: (values: BadgeFormValues) => Promise<void>
}

function getInitialFormState(badgeToEdit?: Badge | null): BadgeFormState {
  if (!badgeToEdit) {
    return {
      name: "",
      description: "",
    }
  }

  return {
    name: badgeToEdit.name,
    description: badgeToEdit.description,
  }
}

function BadgeFormContent({
  badgeToEdit,
  isSubmitting,
  onClose,
  onSubmit,
}: BadgeFormContentProps) {
  const [formValues, setFormValues] = useState<BadgeFormState>(() =>
    getInitialFormState(badgeToEdit),
  )

  const [formError, setFormError] = useState("")

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setFormError("")

    if (!formValues.name.trim()) {
      setFormError("Il nome del badge è obbligatorio.")
      return
    }

    if (!formValues.description.trim()) {
      setFormError("La descrizione del badge è obbligatoria.")
      return
    }

    await onSubmit({
      name: formValues.name.trim(),
      description: formValues.description.trim(),
    })
  }

  const submitLabel = badgeToEdit ? "Salva modifiche" : "Crea badge"
  const loadingLabel = badgeToEdit ? "Salvataggio..." : "Creazione..."

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
        label="Nome badge"
        name="badgeName"
        type="text"
        placeholder="Es. Apprendista Avventuriero"
        value={formValues.name}
        onChange={(event) =>
          setFormValues((current) => ({
            ...current,
            name: event.target.value,
          }))
        }
      />

      <div className="space-y-2">
        <label
          htmlFor="badgeDescription"
          className="block text-sm font-bold text-[var(--text-main)]"
        >
          Descrizione
        </label>

        <textarea
          id="badgeDescription"
          name="badgeDescription"
          rows={5}
          placeholder="Descrivi quando e perché viene assegnato questo badge."
          value={formValues.description}
          onChange={(event) =>
            setFormValues((current) => ({
              ...current,
              description: event.target.value,
            }))
          }
          className="w-full resize-none rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] placeholder:text-[var(--text-muted)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
        />
      </div>

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

export default function BadgeFormModal({
  isOpen,
  title,
  description,
  badgeToEdit,
  isSubmitting,
  onClose,
  onSubmit,
}: BadgeFormModalProps) {
  const formKey = badgeToEdit?.id ?? "new"

  return (
    <AppModal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onClose}
    >
      <BadgeFormContent
        key={formKey}
        badgeToEdit={badgeToEdit}
        isSubmitting={isSubmitting}
        onClose={onClose}
        onSubmit={onSubmit}
      />
    </AppModal>
  )
}
