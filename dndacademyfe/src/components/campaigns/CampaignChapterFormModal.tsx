"use client"

import RichTextEditor from "@/components/common/RichTextEditor"
import AppButton from "@/components/common/AppButton"
import AppModal from "@/components/common/AppModal"
import FormInput from "@/components/common/FormInput"
import type { Badge } from "@/types/badge"
import type { CampaignChapterFormValues } from "@/types/campaignChapterForm"
import type { Lesson } from "@/types/lesson"
import type { Quiz } from "@/types/quiz"

type CampaignChapterFormModalProps = {
  isOpen: boolean
  title: string
  description: string
  values: CampaignChapterFormValues
  lessons: Lesson[]
  selectedQuiz: Quiz | null
  badges: Badge[]
  isLoadingQuiz: boolean
  isSubmitting: boolean
  submitLabel: string
  error?: string
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onChange: <K extends keyof CampaignChapterFormValues>(
    field: K,
    value: CampaignChapterFormValues[K],
  ) => void
}

export default function CampaignChapterFormModal({
  isOpen,
  title,
  description,
  values,
  lessons,
  selectedQuiz,
  badges,
  isLoadingQuiz,
  isSubmitting,
  submitLabel,
  error,
  onClose,
  onSubmit,
  onChange,
}: CampaignChapterFormModalProps) {
  return (
    <AppModal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onClose}
      size="xl"
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-lg font-black text-[var(--text-main)]">
            Contenuto narrativo
          </h3>

          <div className="grid gap-4 md:grid-cols-[1fr_160px]">
            <FormInput
              label="Titolo capitolo"
              name="title"
              type="text"
              value={values.title}
              onChange={(event) => onChange("title", event.target.value)}
            />

            <FormInput
              label="Ordine"
              name="orderIndex"
              type="number"
              value={values.orderIndex}
              onChange={(event) =>
                onChange("orderIndex", Number(event.target.value))
              }
            />
          </div>

          <RichTextEditor
            label="Descrizione breve"
            value={values.description}
            onChange={(value) => onChange("description", value)}
            maxLength={1000}
            disabled={isSubmitting}
            rows={3}
          />

          <RichTextEditor
            label="Testo narrativo"
            value={values.storyText}
            onChange={(value) => onChange("storyText", value)}
            maxLength={8000}
            disabled={isSubmitting}
            rows={8}
          />
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-[var(--text-main)]">
            Requisiti didattici
          </h3>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label
                htmlFor="lessonId"
                className="block text-sm font-bold text-[var(--text-main)]"
              >
                Lezione collegata
              </label>

              <select
                id="lessonId"
                value={values.lessonId ?? ""}
                onChange={(event) => {
                  const value = event.target.value
                  onChange("lessonId", value ? Number(value) : null)
                }}
                className="w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              >
                <option value="">Nessuna lezione</option>

                {lessons.map((lesson) => (
                  <option key={lesson.id} value={lesson.id}>
                    {lesson.title}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="quizId"
                className="block text-sm font-bold text-[var(--text-main)]"
              >
                Quiz collegato
              </label>

              <select
                id="quizId"
                value={values.quizId ?? ""}
                disabled={!values.lessonId || isLoadingQuiz || !selectedQuiz}
                onChange={(event) => {
                  const value = event.target.value
                  onChange("quizId", value ? Number(value) : null)
                }}
                className="w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] disabled:cursor-not-allowed disabled:opacity-60 focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
              >
                <option value="">
                  {isLoadingQuiz
                    ? "Caricamento quiz..."
                    : selectedQuiz
                      ? "Seleziona quiz"
                      : "Nessun quiz disponibile"}
                </option>

                {selectedQuiz && (
                  <option value={selectedQuiz.id}>{selectedQuiz.title}</option>
                )}
              </select>

              {values.lessonId && !isLoadingQuiz && !selectedQuiz && (
                <p className="text-xs text-[var(--text-muted)]">
                  Nessun quiz collegato a questa lezione.
                </p>
              )}
            </div>
          </div>

          <label className="flex items-center gap-3 rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3">
            <input
              type="checkbox"
              checked={values.hasCombat}
              onChange={(event) => onChange("hasCombat", event.target.checked)}
            />

            <span className="font-bold text-[var(--text-main)]">
              Questo capitolo prevede un combattimento
            </span>
          </label>
        </section>

        <section className="space-y-4">
          <h3 className="text-lg font-black text-[var(--text-main)]">
            Ricompensa
          </h3>

          <div className="space-y-2">
            <label
              htmlFor="rewardBadgeId"
              className="block text-sm font-bold text-[var(--text-main)]"
            >
              Badge ricompensa
            </label>

            <select
              id="rewardBadgeId"
              value={values.rewardBadgeId ?? ""}
              onChange={(event) => {
                const value = event.target.value
                onChange("rewardBadgeId", value ? Number(value) : null)
              }}
              className="w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
            >
              <option value="">Nessun badge</option>

              {badges.map((badge) => (
                <option key={badge.id} value={badge.id}>
                  {badge.name}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error && (
          <div className="sticky bottom-0 z-20 rounded-2xl border border-[var(--border-danger)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-glow)]">
            <p
              role="alert"
              className="text-sm font-bold text-[var(--text-danger)]"
            >
              {error}
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <AppButton type="button" variant="secondary" onClick={onClose}>
            Annulla
          </AppButton>

          <AppButton type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Salvataggio..." : submitLabel}
          </AppButton>
        </div>
      </form>
    </AppModal>
  )
}
