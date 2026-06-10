import Link from "next/link"
import { FiCheckCircle, FiLock, FiPlayCircle } from "react-icons/fi"

import AppCard from "@/components/common/AppCard"
import type { UserLessonProgress } from "@/types/lesson"

type LessonProgressCardProps = {
  lesson: UserLessonProgress
}

export default function LessonProgressCard({
  lesson,
}: LessonProgressCardProps) {
  const statusLabel = lesson.completed
    ? "Completata"
    : lesson.unlocked
      ? "Disponibile"
      : "Bloccata"

  const StatusIcon = lesson.completed
    ? FiCheckCircle
    : lesson.unlocked
      ? FiPlayCircle
      : FiLock

  return (
    <AppCard
      className={[
        "transition",
        lesson.unlocked
          ? "hover:-translate-y-0.5 hover:border-[var(--border-gold)]"
          : "opacity-60",
      ].join(" ")}
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div
            className={[
              "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
              lesson.completed
                ? "bg-[var(--primary)] text-[var(--bg-app-deep)]"
                : lesson.unlocked
                  ? "bg-[var(--surface-muted)] text-[var(--accent)]"
                  : "bg-[var(--surface-muted)] text-[var(--text-muted)]",
            ].join(" ")}
          >
            <StatusIcon size={22} aria-hidden="true" />
          </div>

          <div>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent-soft)]">
              Lezione {lesson.orderIndex}
            </p>

            <h3 className="mt-1 text-xl font-black text-[var(--text-main)]">
              {lesson.title}
            </h3>

            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Stato: {statusLabel}
            </p>
          </div>
        </div>

        {lesson.unlocked ? (
          <Link
            href={`/lessons/${lesson.lessonId}`}
            className="inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-[var(--primary)] to-[var(--accent)] px-5 py-3 text-sm font-bold text-white transition hover:brightness-110"
          >
            {lesson.completed ? "Rivedi" : "Inizia"}
          </Link>
        ) : (
          <span className="rounded-xl border border-[var(--border-teal-soft)] px-5 py-3 text-sm font-bold text-[var(--text-muted)]">
            Bloccata
          </span>
        )}
      </div>
    </AppCard>
  )
}
