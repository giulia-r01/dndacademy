import Link from "next/link"
import { FiCheckCircle, FiLock, FiPlayCircle } from "react-icons/fi"

import AppCard from "@/components/common/AppCard"
import type { CampaignProgress } from "@/types/campaign-progress"
import AppButton from "@/components/common/AppButton"

const difficultyLabels = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzato",
}

type CampaignProgressCardProps = {
  campaign: CampaignProgress
}

export default function CampaignProgressCard({
  campaign,
}: CampaignProgressCardProps) {
  const status = campaign.completed
    ? "completed"
    : campaign.unlocked
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
      ? "Completata"
      : status === "available"
        ? "Disponibile"
        : "Bloccata"

  return (
    <AppCard className="transition hover:-translate-y-0.5 hover:border-[var(--border-gold)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-full border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-[var(--accent-soft)]">
              {difficultyLabels[campaign.difficulty]}
            </span>

            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-xs font-bold text-[var(--text-soft)]">
              <StatusIcon aria-hidden="true" />
              {statusLabel}
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black text-[var(--text-main)]">
            {campaign.campaignName}
          </h3>

          <p className="mt-3 line-clamp-4 text-sm leading-6 text-[var(--text-muted)]">
            {campaign.campaignDescription}
          </p>

          {campaign.completedAt && (
            <p className="mt-3 text-xs font-bold text-[var(--primary)]">
              Completata il{" "}
              {new Date(campaign.completedAt).toLocaleDateString("it-IT")}
            </p>
          )}
        </div>

        <div className="shrink-0">
          {campaign.unlocked ? (
            <Link href={`/campaigns/${campaign.campaignId}`}>
              <AppButton type="button">
                {campaign.completed ? "Rivedi campagna" : "Vai"}
              </AppButton>
            </Link>
          ) : (
            <AppButton type="button" variant="secondary" disabled>
              Bloccata
            </AppButton>
          )}
        </div>
      </div>
    </AppCard>
  )
}
