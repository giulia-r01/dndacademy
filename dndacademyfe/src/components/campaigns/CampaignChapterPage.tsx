"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import {
  FiArrowLeft,
  FiAward,
  FiBookOpen,
  FiCheckCircle,
  FiHelpCircle,
  FiShield,
} from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import { campaignService } from "@/services/campaign.service"
import { characterService } from "@/services/character.service"
import type { CampaignChapterPlayer } from "@/types/campaign-chapter"
import { chapterBreadcrumbs, chapterHref, chapterRequirementsMet, combatHref, lessonHref, nextChapterAction } from "@/lib/navigation"

export default function CampaignChapterDetailPage({ campaignId, chapterId }: { campaignId: number; chapterId: number }) {

  const [chapter, setChapter] = useState<CampaignChapterPlayer | null>(null)
  const [chapters, setChapters] = useState<CampaignChapterPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCompleting, setIsCompleting] = useState(false)
  const [completeError, setCompleteError] = useState("")
  const [hasCharacter, setHasCharacter] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    async function loadChapter() {
      setIsLoading(true)
      setError("")
      if (Number.isNaN(campaignId) || Number.isNaN(chapterId)) {
        setError("ID capitolo non valido")
        setIsLoading(false)
        return
      }

      try {
        const [chapters, characters] = await Promise.all([
          campaignService.getPlayerChapters(campaignId),
          characterService.getMine(),
        ])
        if (!active) return
        setChapters(chapters)
        setHasCharacter(characters.some(character => character.campaignId === campaignId))

        const selectedChapter = chapters.find(
          (item) => item.chapterId === chapterId,
        )

        if (!selectedChapter) {
          setError("Capitolo non trovato")
          return
        }

        if (!selectedChapter.unlocked) {
          setError("Questo capitolo non è ancora sbloccato")
          return
        }

        setChapter(selectedChapter)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento capitolo"

        if (active) setError(message)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    loadChapter()
    return () => { active = false }
  }, [campaignId, chapterId, attempt])

  async function handleCompleteChapter() {
    if (!chapter || !hasCharacter || chapter.completed || isCompleting) {
      return
    }

    setIsCompleting(true)
    setCompleteError("")

    try {
      const progress = await campaignService.completeChapter(chapterId)

      setChapter((currentChapter) => {
        if (!currentChapter) {
          return null
        }

        return {
          ...currentChapter,
          completed: progress.completed,
          completedAt: progress.completedAt,
        }
      })
      try {
        const updated = await campaignService.getPlayerChapters(campaignId)
        setChapters(updated)
        const refreshed = updated.find(item => item.chapterId === chapterId)
        if (refreshed) setChapter(refreshed)
      } catch {
        setCompleteError("Capitolo completato. Torna alla campagna per aggiornare l’elenco dei prossimi capitoli.")
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Errore durante il completamento del capitolo"

      setCompleteError(message)
    } finally {
      setIsCompleting(false)
    }
  }

  return (
    <AppShell breadcrumbs={chapter ? chapterBreadcrumbs(chapter) : undefined}>
      <section className="space-y-6">
        <Link
          href={`/campaigns/${campaignId}`}
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-soft)] transition hover:text-[var(--accent-soft)]"
        >
          <FiArrowLeft aria-hidden="true" />
          Torna ai capitoli
        </Link>

        {isLoading && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento capitolo...</p>
          </AppCard>
        )}

        {error && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {error}
            </p>
            <AppButton className="mt-4" variant="secondary" onClick={() => setAttempt(value => value + 1)}>Riprova</AppButton>
          </AppCard>
        )}

        {!isLoading && !error && chapter && !hasCharacter && !chapter.completed && (
          <AppCard className="space-y-4 border-[var(--border-gold)]">
            <h2 className="text-2xl font-black">Prima di iniziare, scegli il tuo personaggio</h2>
            <p className="text-[var(--text-soft)]">Per giocare a {chapter.campaignName}, scegli chi interpreterai tra i personaggi preparati dal Master. Poi potrai iniziare i capitoli.</p>
            <AppButton href={`/characters?campaignId=${campaignId}`}>Scegli il tuo personaggio</AppButton>
          </AppCard>
        )}

        {!isLoading && !error && chapter && (hasCharacter || chapter.completed) && (
          <>
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
                Capitolo {chapter.orderIndex}
              </p>

              <h2 className="mt-2 text-3xl font-black text-[var(--text-main)]">
                {chapter.title}
              </h2>

              {chapter.description && (
                <p className="mt-2 max-w-3xl text-[var(--text-soft)]">
                  {chapter.description}
                </p>
              )}
            </div>

            {!chapter.completed && <AppCard className="space-y-3 border-[var(--border-gold)]"><h3 className="text-lg font-black">Il tuo prossimo passo</h3><p className="text-sm text-[var(--text-soft)]">{chapterRequirementsMet(chapter) ? "Hai soddisfatto i requisiti: leggi la storia e completa il capitolo per proseguire." : "Segui le attività richieste e torna qui per completare il capitolo."}</p>{!chapterRequirementsMet(chapter) && <AppButton href={nextChapterAction(chapter).href}>{nextChapterAction(chapter).label}</AppButton>}</AppCard>}
            {chapter.completed && <AppCard className="space-y-3 border-[var(--primary)]"><p role="status">Capitolo completato! I tuoi progressi sono salvati.</p>{(() => {
              const next = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex).find(item => item.orderIndex > chapter.orderIndex && item.unlocked && !item.completed)
              return next ? <AppButton href={chapterHref(campaignId, next.chapterId)}>Vai al prossimo capitolo</AppButton> : <AppButton href={`/campaigns/${campaignId}`} variant="secondary">Torna alla campagna</AppButton>
            })()}</AppCard>}
            <AppCard>
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
                Storia
              </p>

              <p className="mt-4 whitespace-pre-line text-base leading-8 text-[var(--text-soft)]">
                {chapter.storyText}
              </p>
            </AppCard>

            <div className="grid gap-4 lg:grid-cols-2">
              {chapter.lessonId && (
                <ActionCard
                  icon={<FiBookOpen aria-hidden="true" />}
                  title="Lezione"
                  description={
                    chapter.lessonTitle ?? "Completa la lezione collegata."
                  }
                  href={lessonHref(chapter.lessonId, { campaignId, chapterId })}
                  label={chapter.lessonCompleted ? "Rivedi lezione" : "Vai alla lezione"}
                  completed={chapter.lessonCompleted}
                  statusLabel={chapter.lessonCompleted ? "Lezione completata" : "Da completare"}
                  hint={chapter.lessonCompleted ? "Puoi rivedere la lezione: il completamento resta salvato." : "Completa la lezione per soddisfare questo requisito."}
                />
              )}

              {chapter.quizId && (
                <ActionCard
                  icon={<FiHelpCircle aria-hidden="true" />}
                  title="Quiz"
                  description={chapter.quizTitle ?? "Supera il quiz collegato."}
                  href={lessonHref((chapter.quizLessonId ?? chapter.lessonId)!, { campaignId, chapterId }, true)}
                  label={chapter.quizPassed ? "Ripeti quiz" : "Vai al quiz"}
                  completed={chapter.quizPassed}
                  statusLabel={chapter.quizPassed ? "Quiz superato" : "Da superare"}
                  hint={chapter.quizPassed ? "Puoi ripeterlo per esercitarti: il superamento resta valido." : "Supera il quiz per soddisfare questo requisito."}
                />
              )}

              {chapter.hasCombat && (
                <ActionCard
                  icon={<FiShield aria-hidden="true" />}
                  title="Combattimento"
                  description="Affronta il combattimento previsto da questo capitolo."
                  href={combatHref(chapter.campaignId, chapter.chapterId)}
                  label={chapter.combatWon ? "Ripeti combattimento" : "Avvia combattimento"}
                  completed={chapter.combatWon}
                  statusLabel={chapter.combatWon ? "Combattimento vinto" : "Da vincere"}
                  hint={chapter.combatWon ? "Hai già ottenuto una vittoria per questo capitolo." : "Vinci lo scontro per soddisfare questo requisito."}
                />
              )}

              {chapter.rewardBadgeId !== null && (
                <RewardCard
                  rewardBadgeName={chapter.rewardBadgeName}
                  completed={chapter.completed}
                />
              )}
            </div>

            <AppCard>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <h3 className="text-xl font-black text-[var(--text-main)]">
                    Completamento capitolo
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    Il capitolo viene completato solo dopo aver soddisfatto
                    tutti i requisiti: lezione, quiz e combattimento se
                    presenti.
                  </p>
                </div>
                {completeError && (
                  <p role="alert" className="text-danger">
                    {completeError}
                  </p>
                )}

                <AppButton
                  type="button"
                  onClick={handleCompleteChapter}
                  disabled={chapter.completed || isCompleting || !chapterRequirementsMet(chapter)}
                >
                  {isCompleting
                    ? "Completamento in corso..."
                    : chapter.completed
                      ? "Capitolo completato"
                      : "Completa capitolo"}
                </AppButton>
              </div>
            </AppCard>
          </>
        )}
      </section>
    </AppShell>
  )
}

type ActionCardProps = {
  icon: React.ReactNode
  title: string
  description: string
  href: string
  label: string
  completed: boolean
  statusLabel: string
  hint: string
}

function ActionCard({
  icon,
  title,
  description,
  href,
  label,
  completed,
  statusLabel,
  hint,
}: ActionCardProps) {
  return (
    <AppCard role="region" aria-label={title} className={completed ? "border-[var(--primary)]/60" : ""}>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-black text-[var(--text-main)]">
            {title}
          </h3>

          <p className={`mt-2 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold ${completed ? "bg-emerald-500/10 text-emerald-300" : "bg-[var(--surface-muted)] text-[var(--accent-soft)]"}`}>
            {completed && <FiCheckCircle aria-hidden="true" />}{statusLabel}
          </p>
          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            {description}
          </p>

          <p className="mt-2 text-sm text-[var(--text-soft)]">{hint}</p>
          <div className="mt-4">
            <AppButton href={href} variant={completed ? "secondary" : "primary"}>{label}</AppButton>
          </div>
        </div>
      </div>
    </AppCard>
  )
}

function RewardCard({
  rewardBadgeName,
  completed,
}: {
  rewardBadgeName: string | null
  completed: boolean
}) {
  return (
    <AppCard>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
          {completed ? (
            <FiCheckCircle aria-hidden="true" />
          ) : (
            <FiAward aria-hidden="true" />
          )}
        </div>

        <div>
          <h3 className="text-xl font-black text-[var(--text-main)]">
            Ricompensa
          </h3>

          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            {completed
              ? `Hai ottenuto il badge: ${rewardBadgeName ?? "Ricompensa capitolo"}.`
              : `Completa il capitolo per ottenere: ${rewardBadgeName ?? "Ricompensa capitolo"}.`}
          </p>
        </div>
      </div>
    </AppCard>
  )
}
