"use client"

import { useEffect, useState } from "react"
import { FiAward, FiBookOpen, FiTarget, FiZap } from "react-icons/fi"

import AchievementCard from "@/components/dashboard/AchievementCard"
import ProgressCourseCard from "@/components/dashboard/ProgressCourseCard"
import StatCard from "@/components/dashboard/StatCard"
import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { badgeService } from "@/services/badge.service"
import { lessonService } from "@/services/lesson.service"
import { quizService } from "@/services/quiz.service"
import type { Badge } from "@/types/badge"
import type { UserLessonProgress } from "@/types/lesson"
import type { UserQuizResult } from "@/types/quiz"

export default function DashboardPage() {
  const { user } = useCurrentUser()

  const [lessons, setLessons] = useState<UserLessonProgress[]>([])
  const [quizResults, setQuizResults] = useState<UserQuizResult[]>([])
  const [badges, setBadges] = useState<Badge[]>([])

  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [lessonsData, quizResultsData, badgesData] = await Promise.all([
          lessonService.getMyProgress(),
          quizService.getMyResults(),
          badgeService.getMyBadges(),
        ])

        setLessons(lessonsData)
        setQuizResults(quizResultsData)
        setBadges(badgesData)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Errore nel caricamento dashboard"

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const completedLessons = lessons.filter((lesson) => lesson.completed).length
  const passedQuizzes = quizResults.filter((quiz) => quiz.passed).length
  const unlockedBadges = badges.length
  const nextLessons = lessons.filter((lesson) => !lesson.completed).slice(0, 3)

  const totalLessons = lessons.length
  const progress =
    totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0

  return (
    <AppShell>
      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)]">
            Continua il tuo percorso
          </h2>

          <p className="mt-2 text-[var(--text-soft)]">
            {user
              ? `Ciao, ${user.username}. Continua la tua avventura.`
              : "Continua la tua avventura e completa le prossime lezioni."}
          </p>
        </div>

        {isLoading && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento dashboard...</p>
          </AppCard>
        )}

        {error && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {error}
            </p>
          </AppCard>
        )}

        {!isLoading && !error && (
          <>
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
              <StatCard
                title="Lezioni completate"
                value={`${completedLessons}`}
                icon={<FiBookOpen size={22} aria-hidden="true" />}
              />

              <StatCard
                title="Quiz superati"
                value={`${passedQuizzes}`}
                icon={<FiTarget size={22} aria-hidden="true" />}
              />

              <StatCard
                title="Badge ottenuti"
                value={`${unlockedBadges}`}
                icon={<FiAward size={22} aria-hidden="true" />}
              />

              <StatCard
                title="Livello"
                value={user?.learningLevel ?? "BEGINNER"}
                icon={<FiZap size={22} aria-hidden="true" />}
              />
            </div>

            <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
              <div className="space-y-5">
                <h2 className="text-xl font-black text-[var(--text-main)]">
                  Progressi lezioni
                </h2>

                <ProgressCourseCard
                  title="Percorso base D&D"
                  level={user?.learningLevel ?? "BEGINNER"}
                  completedLessons={completedLessons}
                  totalLessons={totalLessons}
                  progress={progress}
                />

                <AppCard>
                  <h3 className="text-lg font-black text-[var(--text-main)]">
                    Prossime lezioni
                  </h3>

                  {nextLessons.length > 0 ? (
                    <div className="mt-4 space-y-3">
                      {nextLessons.map((lesson) => (
                        <div
                          key={lesson.lessonId}
                          className="flex items-center justify-between gap-4 rounded-xl bg-[var(--surface-muted)] px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-[var(--text-main)]">
                              {lesson.title}
                            </p>
                            <p className="text-xs text-[var(--text-muted)]">
                              Lezione {lesson.orderIndex}
                            </p>
                          </div>

                          <span className="text-xs font-bold text-[var(--accent-soft)]">
                            {lesson.unlocked ? "Disponibile" : "Bloccata"}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="mt-4 rounded-xl bg-[var(--surface-muted)] px-4 py-4">
                      <p className="text-sm font-bold text-[var(--text-main)]">
                        Hai completato tutte le lezioni disponibili.
                      </p>

                      <p className="mt-1 text-sm text-[var(--text-muted)]">
                        Puoi rivedere le lezioni già completate o attendere
                        nuovi contenuti.
                      </p>
                    </div>
                  )}
                </AppCard>
              </div>

              <aside className="space-y-5">
                <h2 className="text-xl font-black text-[var(--text-main)]">
                  Badge
                </h2>

                {badges.length === 0 && (
                  <AppCard>
                    <p className="text-[var(--text-muted)]">
                      Non hai ancora sbloccato badge.
                    </p>
                  </AppCard>
                )}

                {badges.slice(0, 3).map((badge) => (
                  <AchievementCard
                    key={badge.id}
                    title={badge.name}
                    description={badge.description}
                    unlocked
                    icon={<FiAward size={22} aria-hidden="true" />}
                  />
                ))}
              </aside>
            </div>
          </>
        )}
      </section>
    </AppShell>
  )
}
