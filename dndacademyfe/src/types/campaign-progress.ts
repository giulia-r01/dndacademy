export type CampaignDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"

export type CampaignProgress = {
  campaignId: number
  campaignName: string
  campaignDescription: string
  difficulty: CampaignDifficulty
  unlocked: boolean
  completed: boolean
  completedAt: string | null
}
