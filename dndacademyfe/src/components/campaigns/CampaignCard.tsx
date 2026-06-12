import { FiMap, FiUser } from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import type { Campaign } from "@/types/campaign"
import Link from "next/link"

type CampaignCardProps = {
  campaign: Campaign
  isJoining?: boolean
  onJoin: (campaignId: number) => void
}

export default function CampaignCard({
  campaign,
  isJoining = false,
  onJoin,
}: CampaignCardProps) {
  return (
    <AppCard className="transition hover:-translate-y-0.5 hover:border-[var(--border-gold)]">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[var(--surface-muted)] text-[var(--accent)]">
            <FiMap size={22} aria-hidden="true" />
          </div>

          <div>
            <h3 className="text-xl font-black text-[var(--text-main)]">
              {campaign.name}
            </h3>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--text-muted)]">
              {campaign.description || "Campagna tutorial senza descrizione."}
            </p>

            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--text-soft)]">
              <FiUser aria-hidden="true" />
              <span>Master: {campaign.masterUsername}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:items-end">
          <AppButton
            type="button"
            disabled={isJoining}
            onClick={() => onJoin(campaign.id)}
          >
            {isJoining ? "Accesso..." : "Unisciti"}
          </AppButton>

          <Link
            href={`/campaigns/${campaign.id}`}
            className="text-sm font-bold text-[var(--text-soft)] transition hover:text-[var(--accent-soft)]"
          >
            Dettagli campagna
          </Link>
        </div>
      </div>
    </AppCard>
  )
}
