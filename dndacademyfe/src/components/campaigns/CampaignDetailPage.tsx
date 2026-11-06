"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
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
import { characterService } from "@/services/character.service"
import EntityPortrait from "@/components/common/EntityPortrait"
import type { Character } from "@/types/character"
import type { CampaignProgress } from "@/types/campaign-progress"
import type { CampaignChapterPlayer } from "@/types/campaign-chapter"
import { chapterHref } from "@/lib/navigation"

export default function CampaignDetailPage({ campaignId }: { campaignId: number }) {

  const [chapters, setChapters] = useState<CampaignChapterPlayer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [campaign, setCampaign] = useState<CampaignProgress | null>(null)
  const [character, setCharacter] = useState<Character | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    async function loadChapters() {
      setIsLoading(true)
      setError("")
      try {
        const [data, progress, characters] = await Promise.all([
          campaignService.getPlayerChapters(campaignId),
          campaignService.getMyProgress(),
          characterService.getMine(),
        ])
        if (!active) return
        setChapters(data)
        setCampaign(progress.find(item => item.campaignId === campaignId) ?? null)
        setCharacter(characters.find(item => item.campaignId === campaignId) ?? null)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento capitoli"

        if (active) setError(message)
      } finally {
        if (active) setIsLoading(false)
      }
    }

    if (!Number.isNaN(campaignId)) {
      loadChapters()
    }
    return () => { active = false }
  }, [campaignId, attempt])

  const campaignTitle = campaign?.campaignName ?? chapters[0]?.campaignName ?? "Campagna"
  const orderedChapters = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <AppShell breadcrumbs={[{ label: "Campagne", href: "/campaigns" }, { label: campaignTitle }]}>
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
            <AppButton className="mt-4" variant="secondary" onClick={() => setAttempt(value => value + 1)}>Riprova</AppButton>
          </AppCard>
        )}

        {!isLoading && !error && (
          <AppCard className="space-y-5">
            <div>
              <h3 className="text-xl font-black">La tua avventura</h3>
              <p className="mt-2 whitespace-pre-line leading-7 text-[var(--text-soft)]">{campaign?.campaignDescription?.trim() || "Scopri la storia attraverso i capitoli e metti in pratica ciò che impari."}</p>
              <p className="mt-3 text-sm text-[var(--text-muted)]">{chapters.filter(chapter => chapter.completed).length} capitoli completati su {chapters.length}</p>
            </div>
            <div className="flex flex-col gap-4 rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] p-4 sm:flex-row sm:items-center">
              {character && <EntityPortrait name={character.name} imageUrl={character.imageUrl} className="h-24 w-20 shrink-0" />}
              <div className="min-w-0 flex-1">
                <h4 className="text-lg font-black">{character ? `Il tuo personaggio: ${character.name}` : "1. Scegli il tuo personaggio"}</h4>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{character ? `${character.race} · ${character.characterClass} · Livello ${character.level}. Sei pronto per entrare nella storia.` : "Prima di iniziare, scegli chi interpreterai tra i personaggi preparati dal Master. Poi torna qui per aprire il primo capitolo."}</p>
              </div>
              <AppButton href={`/characters?campaignId=${campaignId}`} variant={character ? "secondary" : "primary"}>{character ? "Vedi il tuo personaggio" : "Scegli il tuo personaggio"}</AppButton>
            </div>
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
            <div><h3 className="text-xl font-black">2. Segui i capitoli</h3><p className="mt-2 text-sm text-[var(--text-muted)]">{!character ? "Scegli prima il personaggio per iniziare. I capitoli si sbloccano in ordine." : "Apri il primo capitolo disponibile e segui le attività indicate. I capitoli completati restano consultabili."}</p></div>
            {orderedChapters.map((chapter, index) => (
              <ChapterCard key={chapter.chapterId} chapter={chapter} first={index === 0} hasCharacter={character !== null} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}

function ChapterCard({ chapter, first, hasCharacter }: { chapter: CampaignChapterPlayer; first: boolean; hasCharacter: boolean }) {
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
          {chapter.unlocked && (hasCharacter || chapter.completed) ? (
            <AppButton href={chapterHref(chapter.campaignId, chapter.chapterId)}>
              {chapter.completed ? "Rivedi" : first && !chapter.lessonCompleted && !chapter.quizPassed && !chapter.combatWon ? "Inizia" : "Continua"}
            </AppButton>
          ) : (
            <AppButton type="button" variant="secondary" disabled>
              {chapter.unlocked ? "Scegli prima il personaggio" : "Bloccato"}
            </AppButton>
          )}
        </div>
      </div>
    </AppCard>
  )
}
