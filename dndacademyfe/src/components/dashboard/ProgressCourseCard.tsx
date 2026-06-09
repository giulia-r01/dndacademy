import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"

type ProgressCourseCardProps = {
  title: string
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED"
  completedLessons: number
  totalLessons: number
  progress: number
}

const levelLabels = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzato",
}

export default function ProgressCourseCard({
  title,
  level,
  completedLessons,
  totalLessons,
  progress,
}: ProgressCourseCardProps) {
  return (
    <AppCard>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-[var(--text-main)]">
            {title}
          </h3>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="rounded-lg border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold text-[var(--accent-soft)]">
              {levelLabels[level]}
            </span>

            <span className="text-sm font-bold text-[var(--accent-soft)]">
              {completedLessons} / {totalLessons} lezioni
            </span>
          </div>
        </div>

        <AppButton className="sm:w-auto">Continua</AppButton>
      </div>

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-sm font-bold">
          <span className="text-[var(--accent-soft)]">Progresso</span>
          <span className="text-[var(--text-soft)]">{progress}%</span>
        </div>

        <div
          className="h-3 overflow-hidden rounded-full bg-[var(--surface-muted)]"
          aria-label={`Progresso ${progress}%`}
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </AppCard>
  )
}
