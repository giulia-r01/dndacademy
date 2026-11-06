"use client"

import { useEffect, useState } from "react"
import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import { campaignService } from "@/services/campaign.service"
import { chapterHref, nextChapterAction } from "@/lib/navigation"
import type { CampaignProgress } from "@/types/campaign-progress"
import type { CampaignChapterPlayer } from "@/types/campaign-chapter"

export default function CampaignResumeCard({ campaign, hasCharacter }: { campaign: CampaignProgress; hasCharacter: boolean }) {
  const [chapters, setChapters] = useState<CampaignChapterPlayer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  useEffect(() => {
    let active = true
    campaignService.getPlayerChapters(campaign.campaignId).then(result => { if (active) setChapters(result) })
      .catch((err: unknown) => { if (active) setError(err instanceof Error ? err.message : "Impossibile caricare il prossimo passo.") })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [campaign.campaignId])
  const next = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex).find(chapter => chapter.unlocked && !chapter.completed)
  const action = next ? nextChapterAction(next) : null
  return <AppCard className="flex h-full flex-col gap-4 border-[var(--border-gold)]">
    <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--accent-soft)]">Campagna in corso</p><h3 className="mt-2 text-xl font-black">{campaign.campaignName}</h3></div>
    {!hasCharacter ? <p className="text-sm text-[var(--text-soft)]">Ti sei unito alla campagna. Prima di iniziare i capitoli, scegli il personaggio che interpreterai.</p> : loading ? <p role="status">Cerco il prossimo passo...</p> : error ? <p role="alert" className="text-sm text-[var(--danger)]">{error}</p> : next ? <>
      <p className="text-sm text-[var(--text-soft)]">Capitolo {next.orderIndex}: {next.title}</p>
      <p className="text-sm text-[var(--accent-soft)]">Prossimo passo: {action?.label}</p>
      <p className="text-sm text-[var(--text-muted)]">{chapters.filter(chapter => chapter.completed).length} capitoli completati su {chapters.length}</p>
    </> : <p className="text-sm text-[var(--text-soft)]">{chapters.length ? "Hai completato i capitoli disponibili. Consulta la campagna per i prossimi aggiornamenti." : "Il Master sta preparando i capitoli di questa avventura."}</p>}
    <div className="mt-auto flex flex-wrap gap-3">
      {!hasCharacter ? <AppButton href={`/characters?campaignId=${campaign.campaignId}`}>Scegli il tuo personaggio</AppButton> : !loading && !error && next && <AppButton href={chapterHref(next.campaignId, next.chapterId)}>Continua capitolo</AppButton>}
      <AppButton href={`/campaigns/${campaign.campaignId}`} variant="secondary">Apri campagna</AppButton>
    </div>
  </AppCard>
}
