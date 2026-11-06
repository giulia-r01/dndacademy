"use client"

import { useEffect, useState } from "react"
import { campaignService } from "@/services/campaign.service"
import type { ChapterContext } from "@/lib/navigation"
import type { CampaignChapterPlayer } from "@/types/campaign-chapter"

export function useChapterContext(
  lessonId: number,
  context: ChapterContext | null,
  quiz = false,
) {
  const [chapter, setChapter] = useState<CampaignChapterPlayer | null>(null)
  const [loading, setLoading] = useState(context !== null)
  const [error, setError] = useState("")
  const campaignId = context?.campaignId,
    chapterId = context?.chapterId
  useEffect(() => {
    if (!campaignId || !chapterId) return
    let active = true
    campaignService
      .getPlayerChapters(campaignId)
      .then((chapters) => {
        const selected = chapters.find((item) => item.chapterId === chapterId)
        const matchingLesson = quiz
          ? (selected?.quizLessonId ?? selected?.lessonId) === lessonId &&
            selected?.quizId != null
          : selected?.lessonId === lessonId ||
            (selected?.quizId != null && selected.quizLessonId === lessonId)
        if (!selected || !selected.unlocked || !matchingLesson)
          throw new Error(
            "Questa attività non è disponibile nel capitolo indicato. Puoi consultare la biblioteca lezioni.",
          )
        if (active) setChapter(selected)
      })
      .catch((err: unknown) => {
        if (active)
          setError(
            err instanceof Error
              ? err.message
              : "Impossibile recuperare il capitolo di provenienza.",
          )
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [campaignId, chapterId, lessonId, quiz])
  return { chapter, loading, error }
}
