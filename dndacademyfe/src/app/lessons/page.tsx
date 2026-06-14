"use client"

import { useEffect, useState } from "react"

import LessonProgressCard from "@/components/lessons/LessonProgressCard"
import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import { lessonService } from "@/services/lesson.service"
import type { UserLessonProgress } from "@/types/lesson"

export default function LessonsPage() {
  const [lessons, setLessons] = useState<UserLessonProgress[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadLessons() {
      try {
        const data = await lessonService.getMyProgress()
        setLessons(data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento lezioni"

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadLessons()
  }, [])

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)]">
            Lezioni
          </h2>

          <p className="mt-2 max-w-2xl text-[var(--text-soft)]">
            Segui il percorso didattico passo dopo passo. Completa le lezioni e
            supera i quiz per sbloccare nuovi contenuti.
          </p>
        </div>

        {isLoading && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento lezioni...</p>
          </AppCard>
        )}

        {error && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {error}
            </p>
          </AppCard>
        )}

        {!isLoading && !error && lessons.length === 0 && (
          <AppCard>
            <p className="text-[var(--text-muted)]">
              Non ci sono ancora lezioni disponibili.
            </p>
          </AppCard>
        )}

        {!isLoading && !error && lessons.length > 0 && (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <LessonProgressCard key={lesson.lessonId} lesson={lesson} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}
