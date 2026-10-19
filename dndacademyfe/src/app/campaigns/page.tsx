"use client"

import { useEffect, useState } from "react"

import CampaignProgressCard from "@/components/campaigns/CampaignProgressCard"
import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import { campaignService } from "@/services/campaign.service"
import type { CampaignProgress } from "@/types/campaign-progress"

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignProgress[]>([])
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)
  const [joiningCampaignId, setJoiningCampaignId] = useState<number | null>(null)
  const [joinError, setJoinError] = useState("")

  useEffect(() => {
    async function loadCampaignProgress() {
      try {
        const data = await campaignService.getMyProgress()
        setCampaigns(data)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Errore nel caricamento progressi campagne"

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaignProgress()
  }, [])

  const completedCampaigns = campaigns.filter((campaign) => campaign.completed)
  const availableCampaigns = campaigns.filter(
    (campaign) => campaign.unlocked && !campaign.completed,
  )
  const lockedCampaigns = campaigns.filter((campaign) => !campaign.unlocked)

  async function handleJoinCampaign(campaignId: number) {
    if (joiningCampaignId !== null) {
      return
    }

    setJoiningCampaignId(campaignId)
    setJoinError("")

    try {
      await campaignService.join(campaignId)

      const updatedCampaigns = await campaignService.getMyProgress()

      setCampaigns(updatedCampaigns)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Errore durante l'iscrizione alla campagna"

      setJoinError(message)
    } finally {
      setJoiningCampaignId(null)
    }
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
            Percorso narrativo
          </p>

          <h2 className="mt-2 text-3xl font-black text-[var(--text-main)]">
            Campagne
          </h2>

          <p className="mt-2 max-w-3xl text-[var(--text-soft)]">
            Segui campagne guidate a capitoli, completa lezioni, quiz e
            combattimenti, poi sblocca avventure di difficoltà superiore.
          </p>
        </div>

        {isLoading && (
          <AppCard>
            <p className="text-[var(--text-muted)]">Caricamento campagne...</p>
          </AppCard>
        )}

        {error && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {error}
            </p>
          </AppCard>
        )}

        {joinError && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {joinError}
            </p>
          </AppCard>
        )}

        {!isLoading && !error && campaigns.length === 0 && (
          <AppCard>
            <p className="text-[var(--text-muted)]">
              Non ci sono ancora campagne disponibili.
            </p>
          </AppCard>
        )}

        {!isLoading && !error && campaigns.length > 0 && (
          <div className="space-y-8">
            {availableCampaigns.length > 0 && (
              <CampaignSection
                title="Disponibili"
                description="Campagne che puoi iniziare o continuare."
                campaigns={availableCampaigns}
                onJoin={handleJoinCampaign}
                joiningCampaignId={joiningCampaignId}
              />
            )}

            {completedCampaigns.length > 0 && (
              <CampaignSection
                title="Completate"
                description="Campagne che hai già portato a termine."
                campaigns={completedCampaigns}
                onJoin={handleJoinCampaign}
                joiningCampaignId={joiningCampaignId}
              />
            )}

            {lockedCampaigns.length > 0 && (
              <CampaignSection
                title="Bloccate"
                description="Completa campagne di difficoltà precedente per sbloccarle."
                campaigns={lockedCampaigns}
                onJoin={handleJoinCampaign}
                joiningCampaignId={joiningCampaignId}
              />
            )}
          </div>
        )}
      </section>
    </AppShell>
  )
}

type CampaignSectionProps = {
  title: string
  description: string
  campaigns: CampaignProgress[]
  onJoin: (campaignId: number) => void
  joiningCampaignId: number | null
}

function CampaignSection({
  title,
  description,
  campaigns,
  onJoin,
  joiningCampaignId,
}: CampaignSectionProps) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-xl font-black text-[var(--text-main)]">{title}</h3>

        <p className="mt-1 text-sm text-[var(--text-muted)]">{description}</p>
      </div>

      <div className="space-y-4">
        {campaigns.map((campaign) => (
          <CampaignProgressCard
            key={campaign.campaignId}
            campaign={campaign}
            onJoin={onJoin}
            isJoining={joiningCampaignId === campaign.campaignId}
          />
        ))}
      </div>
    </section>
  )
}
