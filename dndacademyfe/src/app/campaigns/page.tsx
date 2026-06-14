"use client"

import { useEffect, useState } from "react"

import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import CampaignCard from "@/components/campaigns/CampaignCard"
import { campaignService } from "@/services/campaign.service"
import type { Campaign } from "@/types/campaign"

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [joiningCampaignId, setJoiningCampaignId] = useState<number | null>(
    null,
  )
  const [successMessage, setSuccessMessage] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const data = await campaignService.getAll()
        setCampaigns(data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento campagne"

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaigns()
  }, [])

  async function handleJoin(campaignId: number) {
    setError("")
    setSuccessMessage("")
    setJoiningCampaignId(campaignId)

    try {
      await campaignService.join(campaignId)
      setSuccessMessage("Ti sei unito alla campagna.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore durante l'accesso"

      setError(message)
    } finally {
      setJoiningCampaignId(null)
    }
  }

  return (
    <AppShell>
      <section className="space-y-6">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)]">
            Campagne
          </h2>

          <p className="mt-2 max-w-2xl text-[var(--text-soft)]">
            Scegli una campagna tutorial e fai pratica con regole, personaggi e
            situazioni guidate.
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

        {successMessage && (
          <AppCard>
            <p role="status" className="text-[var(--primary)]">
              {successMessage}
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

        {!isLoading && campaigns.length > 0 && (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign.id}
                campaign={campaign}
                isJoining={joiningCampaignId === campaign.id}
                onJoin={handleJoin}
              />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  )
}
