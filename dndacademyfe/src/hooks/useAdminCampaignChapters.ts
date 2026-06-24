import { useEffect, useState } from "react"

import { badgeService } from "@/services/badge.service"
import { campaignService } from "@/services/campaign.service"
import { lessonService } from "@/services/lesson.service"
import { quizService } from "@/services/quiz.service"
import type { Badge } from "@/types/badge"
import type { CampaignChapter } from "@/types/campaign-chapter"
import type { CampaignChapterFormValues } from "@/types/campaignChapterForm"
import {
  buildCampaignChapterPayload,
  defaultCampaignChapterFormValues,
} from "@/types/campaignChapterForm"
import type { Lesson } from "@/types/lesson"
import type { Quiz } from "@/types/quiz"

export function useAdminCampaignChapters(campaignId: number) {
  const [chapters, setChapters] = useState<CampaignChapter[]>([])
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)

  const [formValues, setFormValues] = useState<CampaignChapterFormValues>(
    defaultCampaignChapterFormValues,
  )

  const [isLoadingChapters, setIsLoadingChapters] = useState(true)
  const [isLoadingOptions, setIsLoadingOptions] = useState(true)
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(false)

  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [modalError, setModalError] = useState("")

  useEffect(() => {
    async function loadChapters() {
      if (Number.isNaN(campaignId)) {
        setError("ID campagna non valido")
        setIsLoadingChapters(false)
        return
      }

      try {
        const data = await campaignService.getChaptersByCampaign(campaignId)
        setChapters(data)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento capitoli"

        setError(message)
      } finally {
        setIsLoadingChapters(false)
      }
    }

    loadChapters()
  }, [campaignId])

  useEffect(() => {
    async function loadOptions() {
      try {
        const [lessonsData, badgesData] = await Promise.all([
          lessonService.getAll(),
          badgeService.getAll(),
        ])

        setLessons(lessonsData)
        setBadges(badgesData)
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Errore nel caricamento dati del form"

        setError(message)
      } finally {
        setIsLoadingOptions(false)
      }
    }

    loadOptions()
  }, [])

  useEffect(() => {
    async function loadQuizByLesson() {
      if (!formValues.lessonId) {
        setSelectedQuiz(null)
        setFormValues((current) => ({
          ...current,
          quizId: null,
        }))
        return
      }

      setIsLoadingQuiz(true)

      try {
        const quiz = await quizService.getByLesson(formValues.lessonId)

        setSelectedQuiz(quiz)
        setFormValues((current) => ({
          ...current,
          quizId: quiz.id,
        }))
      } catch {
        setSelectedQuiz(null)
        setFormValues((current) => ({
          ...current,
          quizId: null,
        }))
      } finally {
        setIsLoadingQuiz(false)
      }
    }

    loadQuizByLesson()
  }, [formValues.lessonId])

  function updateFormField<K extends keyof CampaignChapterFormValues>(
    field: K,
    value: CampaignChapterFormValues[K],
  ) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetForm() {
    setFormValues(defaultCampaignChapterFormValues)
    setSelectedQuiz(null)
    setModalError("")
  }

  function prepareCreateForm() {
    setFormValues({
      ...defaultCampaignChapterFormValues,
      orderIndex: chapters.length + 1,
    })
    setSelectedQuiz(null)
    setModalError("")
    setError("")
    setSuccessMessage("")
  }

  function fillFormFromChapter(chapter: CampaignChapter) {
    setFormValues({
      title: chapter.title,
      description: chapter.description ?? "",
      storyText: chapter.storyText,
      orderIndex: chapter.orderIndex,
      hasCombat: chapter.hasCombat,
      lessonId: chapter.lessonId,
      quizId: chapter.quizId,
      rewardBadgeId: chapter.rewardBadgeId,
    })

    setModalError("")
    setError("")
    setSuccessMessage("")
  }

  function validateForm() {
    if (!formValues.title.trim()) {
      return "Il titolo del capitolo è obbligatorio."
    }

    if (!formValues.description.trim()) {
      return "La descrizione breve è obbligatoria."
    }

    if (!formValues.storyText.trim()) {
      return "Il testo narrativo è obbligatorio."
    }

    if (formValues.orderIndex < 1) {
      return "L'ordine del capitolo deve essere almeno 1."
    }

    return ""
  }

  async function createChapter() {
    const validationError = validateForm()

    if (validationError) {
      setModalError(validationError)
      return false
    }

    setModalError("")
    setIsCreating(true)

    try {
      const createdChapter = await campaignService.createChapter(
        campaignId,
        buildCampaignChapterPayload(formValues),
      )

      setChapters((current) =>
        [...current, createdChapter].sort(
          (a, b) => a.orderIndex - b.orderIndex,
        ),
      )

      setSuccessMessage("Capitolo creato correttamente.")
      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella creazione capitolo"

      setModalError(message)
      return false
    } finally {
      setIsCreating(false)
    }
  }

  async function updateChapter(chapterId: number) {
    const validationError = validateForm()

    if (validationError) {
      setModalError(validationError)
      return false
    }

    setModalError("")
    setIsUpdating(true)

    try {
      const updatedChapter = await campaignService.updateChapter(
        chapterId,
        buildCampaignChapterPayload(formValues),
      )

      setChapters((current) =>
        current
          .map((chapter) =>
            chapter.id === updatedChapter.id ? updatedChapter : chapter,
          )
          .sort((a, b) => a.orderIndex - b.orderIndex),
      )

      setSuccessMessage("Capitolo aggiornato correttamente.")
      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella modifica capitolo"

      setModalError(message)
      return false
    } finally {
      setIsUpdating(false)
    }
  }

  async function deleteChapter(chapterId: number) {
    setError("")
    setSuccessMessage("")
    setIsDeleting(true)

    try {
      await campaignService.deleteChapter(chapterId)

      setChapters((current) =>
        current.filter((chapter) => chapter.id !== chapterId),
      )

      setSuccessMessage("Capitolo eliminato correttamente.")
      return true
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nell'eliminazione capitolo"

      setError(message)
      return false
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    chapters,
    lessons,
    badges,
    selectedQuiz,
    formValues,

    isLoadingChapters,
    isLoadingOptions,
    isLoadingQuiz,
    isCreating,
    isUpdating,
    isDeleting,

    error,
    successMessage,
    modalError,

    setError,
    setSuccessMessage,
    setModalError,

    updateFormField,
    resetForm,
    prepareCreateForm,
    fillFormFromChapter,
    createChapter,
    updateChapter,
    deleteChapter,
  }
}
