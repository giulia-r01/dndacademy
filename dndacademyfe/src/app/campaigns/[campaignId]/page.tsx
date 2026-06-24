"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useParams } from "next/navigation"
import {
  FiArrowLeft,
  FiCheckCircle,
  FiLock,
  FiPlayCircle,
} from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import { campaignService } from "@/services/campaign.service"
import type { CampaignChapterPlayer } from "@/types/campaign-chapter"

export default function CampaignDetailPage() {
  const params = useParams()
  const campaignId = Number(params.campaignId)

  const [chapters, setChapters] = useState<CampaignChapterPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadChapters() {
      try {
        const data = await campaignService.getPlayerChapters(campaignId)
        setChapters(data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento capitoli"

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    if (!Number.isNaN(campaignId)) {
      loadChapters()
    }
  }, [campaignId])

  const campaignTitle = chapters[0]?.campaignName ?? "Campagna"

  return (
    <AppShell>
      <section className="space-y-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-soft)] transition hover:text-[var(--accent-soft)]"
        >
          <FiArrowLeft aria-hidden="true" />
          Torna alle campagne
        </Link>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
            Percorso campagna
          </p>

          <h2 className="mt-2 text-3xl font-black text-[var(--text-main)]">
            {campaignTitle}
          </h2>

          <p className="mt-2 max-w-3xl text-[var(--text-soft)]">
            Completa i capitoli in ordine: narrazione, lezioni, quiz,
            combattimenti e ricompense.
          </p>
        </div>

        {isLoading && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento capitoli...</p>
          </AppCard>
        )}

        {error && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {error}
            </p>
          </AppCard>
        )}

        {!isLoading && !error && chapters.length === 0 && (
          <AppCard>
            <p className="text-[var(--text-muted)]">
              Questa campagna non ha ancora capitoli.
            </p>
          </AppCard>
        )}

        {!isLoading && !error && chapters.length > 0 && (
          <div className="space-y-4">
            {chapters.map((chapter) => (
              <ChapterCard key={chapter.chapterId} chapter={chapter} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}

function ChapterCard({ chapter }: { chapter: CampaignChapterPlayer }) {
  const status = chapter.completed
    ? "completed"
    : chapter.unlocked
      ? "available"
      : "locked"

  const StatusIcon =
    status === "completed"
      ? FiCheckCircle
      : status === "available"
        ? FiPlayCircle
        : FiLock

  const statusLabel =
    status === "completed"
      ? "Completato"
      : status === "available"
        ? "Disponibile"
        : "Bloccato"

  return (
    <AppCard className="transition hover:-translate-y-0.5 hover:border-[var(--border-gold)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-soft)]">
              Capitolo {chapter.orderIndex}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold text-[var(--text-soft)]">
              <StatusIcon aria-hidden="true" />
              {statusLabel}
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black text-[var(--text-main)]">
            {chapter.title}
          </h3>

          {chapter.description && (
            <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
              {chapter.description}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-2 text-xs font-bold text-[var(--text-soft)]">
            {chapter.lessonId && <span>Lezione</span>}
            {chapter.quizId && <span>Quiz</span>}
            {chapter.hasCombat && <span>Combat</span>}
            {chapter.rewardBadgeId && <span>Badge</span>}
          </div>
        </div>

        <div className="shrink-0">
          {chapter.unlocked ? (
            <Link
              href={`/campaigns/${chapter.campaignId}/chapters/${chapter.chapterId}`}
            >
              <AppButton type="button">
                {chapter.completed ? "Rivedi" : "Continua"}
              </AppButton>
            </Link>
          ) : (
            <AppButton type="button" variant="secondary" disabled>
              Bloccato
            </AppButton>
          )}
        </div>
      </div>
    </AppCard>
  )
}
