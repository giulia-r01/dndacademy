"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { FiArrowLeft, FiBookOpen } from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import RichText from "@/components/common/RichText"
import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import { useChapterContext } from "@/hooks/useChapterContext"
import {
  chapterBreadcrumbs,
  chapterHref,
  lessonHref,
  type ChapterContext,
} from "@/lib/navigation"
import { lessonService } from "@/services/lesson.service"
import type { Lesson } from "@/types/lesson"

export default function LessonDetailPage({
  lessonId,
  source,
}: {
  lessonId: number
  source: ChapterContext | null
}) {
  const context = useChapterContext(lessonId, source, false)
  const backToChapter = context.chapter
    ? chapterHref(context.chapter.campaignId, context.chapter.chapterId)
    : null
  const validSource = context.chapter
    ? {
        campaignId: context.chapter.campaignId,
        chapterId: context.chapter.chapterId,
      }
    : null

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [completed, setCompleted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")

  useEffect(() => {
    async function loadLesson() {
      if (Number.isNaN(lessonId)) {
        setError("ID lezione non valido")
        setIsLoading(false)
        return
      }

      try {
        const [data, progress] = await Promise.all([
          lessonService.getById(lessonId),
          lessonService.getMyProgress(),
        ])
        setLesson(data)
        setCompleted(
          progress.some((item) => item.lessonId === lessonId && item.completed),
        )
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento lezione"

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadLesson()
  }, [lessonId])

  async function markAsRead() {
    if (saving || completed) return
    setSaving(true)
    setSaveError("")
    try {
      await lessonService.complete(lessonId)
      setCompleted(true)
    } catch (err) {
      setSaveError(
        err instanceof Error
          ? err.message
          : "Impossibile salvare il completamento della lezione.",
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <AppShell
      activeHref={context.chapter ? "/campaigns" : undefined}
      breadcrumbs={
        context.chapter
          ? [
              ...chapterBreadcrumbs(context.chapter),
              { label: lesson?.title ?? "Lezione" },
            ]
          : undefined
      }
    >
      <section className="space-y-6">
        <Link
          href={backToChapter ?? "/lessons"}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-soft)] transition hover:text-[var(--accent-soft)]"
        >
          <FiArrowLeft aria-hidden="true" />
          {backToChapter ? "Torna al capitolo" : "Torna alla biblioteca"}
        </Link>

        {context.error && (
          <AppCard>
            <p role="alert" className="text-[var(--danger)]">
              {context.error}
            </p>
          </AppCard>
        )}
        {(isLoading || context.loading) && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento lezione...</p>
          </AppCard>
        )}

        {error && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {error}
            </p>
          </AppCard>
        )}

        {!isLoading && !context.loading && !error && lesson && (
          <>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
                Lezione {lesson.orderIndex}
              </p>

              <h2 className="mt-2 text-3xl font-black text-[var(--text-main)]">
                {lesson.title}
              </h2>
            </div>

            <AppCard className="space-y-5">
              <div className="flex items-center gap-3 text-[var(--accent-soft)]">
                <FiBookOpen size={22} aria-hidden="true" />
                <p className="text-sm font-bold uppercase tracking-[0.2em]">
                  Contenuto didattico
                </p>
              </div>

              <RichText reading className="text-[var(--text-soft)]">
                {lesson.content}
              </RichText>
            </AppCard>

            <AppCard className="space-y-3">
              <h3 className="text-lg font-black">La tua lettura</h3>
              {completed && (
                <p role="status" className="text-[var(--primary)]">
                  Lezione completata. Puoi rileggerla quando vuoi.
                </p>
              )}
              <div className="flex flex-col items-start gap-4 sm:flex-row sm:flex-wrap sm:items-center">
                {!completed && (
                  <AppButton disabled={saving} onClick={markAsRead}>
                    {saving ? "Salvataggio..." : "Segna come letta"}
                  </AppButton>
                )}
                {backToChapter && (
                  <AppButton href={backToChapter} variant="secondary">
                    Continua il capitolo
                  </AppButton>
                )}
              </div>
              {saveError && (
                <p role="alert" className="text-[var(--danger)]">
                  {saveError}
                </p>
              )}
            </AppCard>
            {lesson.quiz && (
              <AppCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-xl font-black text-[var(--text-main)]">
                    Pronto per il quiz?
                  </h3>
                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    {completed
                      ? "Ora puoi verificare quello che hai imparato."
                      : "Leggi la lezione e premi Segna come letta per sbloccare il quiz."}
                  </p>
                </div>

                {completed ? (
                  <AppButton href={lessonHref(lesson.id, validSource, true)}>
                    Vai al quiz
                  </AppButton>
                ) : (
                  <AppButton disabled variant="secondary">
                    Prima completa la lezione
                  </AppButton>
                )}
              </AppCard>
            )}
          </>
        )}
      </section>
    </AppShell>
  )
}
