"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
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
import type { CampaignChapterPlayer } from "@/types/campaign-chapter"

export default function CampaignChapterDetailPage() {
  const params = useParams<{ campaignId: string; chapterId: string }>()
  const campaignId = Number(params.campaignId)
  const chapterId = Number(params.chapterId)

  const [chapter, setChapter] = useState<CampaignChapterPlayer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadChapter() {
      if (Number.isNaN(campaignId) || Number.isNaN(chapterId)) {
        setError("ID capitolo non valido")
        setIsLoading(false)
        return
      }

      try {
        const chapters = await campaignService.getPlayerChapters(campaignId)

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

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadChapter()
  }, [campaignId, chapterId])

  return (
    <AppShell>
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
          </AppCard>
        )}

        {!isLoading && !error && chapter && (
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
                  href={`/lessons/${chapter.lessonId}`}
                  label="Vai alla lezione"
                />
              )}

              {chapter.quizId && (
                <ActionCard
                  icon={<FiHelpCircle aria-hidden="true" />}
                  title="Quiz"
                  description={chapter.quizTitle ?? "Supera il quiz collegato."}
                  href={`/lessons/${chapter.lessonId}/quiz`}
                  label="Vai al quiz"
                />
              )}

              {chapter.hasCombat && (
                <ActionCard
                  icon={<FiShield aria-hidden="true" />}
                  title="Combattimento"
                  description="Affronta il combattimento previsto da questo capitolo."
                  href={`/combat?chapterId=${chapter.chapterId}&campaignId=${chapter.campaignId}`}
                  label="Avvia combattimento"
                />
              )}

              {chapter.rewardBadgeId && (
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

                <AppButton type="button" disabled={chapter.completed}>
                  {chapter.completed
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
}

function ActionCard({
  icon,
  title,
  description,
  href,
  label,
}: ActionCardProps) {
  return (
    <AppCard>
      <div className="flex items-start gap-4">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-xl font-black text-[var(--text-main)]">
            {title}
          </h3>

          <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
            {description}
          </p>

          <div className="mt-4">
            <Link href={href}>
              <AppButton type="button">{label}</AppButton>
            </Link>
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
