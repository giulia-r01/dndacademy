import type { CreateCampaignChapterRequest } from "@/types/campaign-chapter"

export type CampaignChapterFormValues = {
  title: string
  description: string
  storyText: string
  orderIndex: number
  hasCombat: boolean
  lessonId: number | null
  quizId: number | null
  rewardBadgeId: number | null
}

export const defaultCampaignChapterFormValues: CampaignChapterFormValues = {
  title: "",
  description: "",
  storyText: "",
  orderIndex: 1,
  hasCombat: false,
  lessonId: null,
  quizId: null,
  rewardBadgeId: null,
}

export function buildCampaignChapterPayload(
  values: CampaignChapterFormValues,
): CreateCampaignChapterRequest {
  return {
    title: values.title.trim(),
    description: values.description.trim(),
    storyText: values.storyText.trim(),
    orderIndex: values.orderIndex,
    hasCombat: values.hasCombat,
    lessonId: values.lessonId,
    quizId: values.quizId,
    rewardBadgeId: values.rewardBadgeId,
  }
}
