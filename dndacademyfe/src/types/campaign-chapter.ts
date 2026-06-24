export type CampaignChapterPlayer = {
  chapterId: number
  campaignId: number
  campaignName: string
  title: string
  description: string | null
  storyText: string
  orderIndex: number
  hasCombat: boolean
  lessonId: number | null
  lessonTitle: string | null
  quizId: number | null
  quizTitle: string | null
  rewardBadgeId: number | null
  rewardBadgeName: string | null
  unlocked: boolean
  completed: boolean
  completedAt: string | null
}

export type CampaignChapter = {
  id: number
  campaignId: number
  campaignName: string
  title: string
  description: string | null
  storyText: string
  orderIndex: number
  hasCombat: boolean
  lessonId: number | null
  lessonTitle: string | null
  quizId: number | null
  quizTitle: string | null
  rewardBadgeId: number | null
  rewardBadgeName: string | null
}

export type CreateCampaignChapterRequest = {
  title: string
  description: string
  storyText: string
  orderIndex: number
  hasCombat: boolean
  lessonId: number | null
  quizId: number | null
  rewardBadgeId: number | null
}
