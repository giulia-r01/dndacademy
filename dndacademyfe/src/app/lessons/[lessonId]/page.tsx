"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { FiArrowLeft, FiBookOpen } from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import { lessonService } from "@/services/lesson.service"
import type { Lesson } from "@/types/lesson"

export default function LessonDetailPage() {
  const params = useParams<{ lessonId: string }>()
  const lessonId = Number(params.lessonId)

  const [lesson, setLesson] = useState<Lesson | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadLesson() {
      if (Number.isNaN(lessonId)) {
        setError("ID lezione non valido")
        setIsLoading(false)
        return
      }

      try {
        const data = await lessonService.getById(lessonId)
        setLesson(data)
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

  return (
    <AppShell>
      <section className="space-y-6">
        <Link
          href="/lessons"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-soft)] transition hover:text-[var(--accent-soft)]"
        >
          <FiArrowLeft aria-hidden="true" />
          Torna alle lezioni
        </Link>

        {isLoading && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento lezione...</p>
          </AppCard>
        )}

        {error && (
          <AppCard>
            <p role="alert" className="text-[var(--danger)]">
              {error}
            </p>
          </AppCard>
        )}

        {!isLoading && !error && lesson && (
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

              <div className="whitespace-pre-line text-base leading-8 text-[var(--text-soft)]">
                {lesson.content}
              </div>
            </AppCard>

            <AppCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-xl font-black text-[var(--text-main)]">
                  Pronto per il quiz?
                </h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                  Dopo aver letto la lezione potrai verificare quello che hai
                  imparato.
                </p>
              </div>

              <Link href={`/lessons/${lesson.id}/quiz`}>
                <AppButton>Vai al quiz</AppButton>
              </Link>
            </AppCard>
          </>
        )}
      </section>
    </AppShell>
  )
}
