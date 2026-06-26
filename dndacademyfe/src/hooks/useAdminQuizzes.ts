import { useEffect, useState } from "react"
import { questionService } from "@/services/question.service"
import { quizService } from "@/services/quiz.service"
import type {
  AdminQuestion,
  CreateQuizRequest,
  Quiz,
  UpdateQuizRequest,
} from "@/types/quiz"

export function useAdminQuizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [questionsByQuizId, setQuestionsByQuizId] = useState<
    Record<number, AdminQuestion[]>
  >({})

  const [expandedQuizId, setExpandedQuizId] = useState<number | null>(null)

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null)
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null)
  const [quizBlockedByRelations, setQuizBlockedByRelations] =
    useState<Quiz | null>(null)

  const [isLoadingQuizzes, setIsLoadingQuizzes] = useState(true)
  const [loadingQuestionsQuizId, setLoadingQuestionsQuizId] = useState<
    number | null
  >(null)

  const [isCreating, setIsCreating] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadInitialQuizzes() {
      try {
        const data = await quizService.getAll()

        if (!isMounted) return

        setQuizzes(data)
      } catch (err) {
        if (!isMounted) return

        const message =
          err instanceof Error ? err.message : "Errore nel caricamento quiz"

        setError(message)
      } finally {
        if (isMounted) {
          setIsLoadingQuizzes(false)
        }
      }
    }

    void loadInitialQuizzes()

    return () => {
      isMounted = false
    }
  }, [])

  async function loadQuestionsForQuiz(quizId: number) {
    setLoadingQuestionsQuizId(quizId)
    setError("")

    try {
      const questions = await questionService.getAdminQuestionsByQuiz(quizId)

      setQuestionsByQuizId((current) => ({
        ...current,
        [quizId]: questions,
      }))
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nel caricamento domande"

      setError(message)
    } finally {
      setLoadingQuestionsQuizId(null)
    }
  }

  async function toggleQuizAccordion(quizId: number) {
    if (expandedQuizId === quizId) {
      setExpandedQuizId(null)
      return
    }

    setExpandedQuizId(quizId)

    if (!questionsByQuizId[quizId]) {
      await loadQuestionsForQuiz(quizId)
    }
  }

  async function refreshQuiz(quizId: number) {
    const updatedQuiz = await quizService.getById(quizId)

    setQuizzes((current) =>
      current.map((quiz) => (quiz.id === quizId ? updatedQuiz : quiz)),
    )
  }

  async function createQuiz(request: CreateQuizRequest) {
    setError("")
    setSuccessMessage("")
    setIsCreating(true)

    try {
      const createdQuiz = await quizService.create(request)

      setQuizzes((current) => [createdQuiz, ...current])
      setSuccessMessage("Quiz creato correttamente.")
      setIsCreateModalOpen(false)
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella creazione quiz"

      setError(message)
    } finally {
      setIsCreating(false)
    }
  }

  async function updateQuiz(id: number, request: UpdateQuizRequest) {
    setError("")
    setSuccessMessage("")
    setIsUpdating(true)

    try {
      const updatedQuiz = await quizService.update(id, request)

      setQuizzes((current) =>
        current.map((quiz) =>
          quiz.id === updatedQuiz.id ? updatedQuiz : quiz,
        ),
      )

      setQuizToEdit(null)
      setSuccessMessage("Quiz aggiornato correttamente.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella modifica quiz"

      setError(message)
    } finally {
      setIsUpdating(false)
    }
  }

  async function deleteQuiz() {
    if (!quizToDelete) return

    setError("")
    setSuccessMessage("")
    setIsDeleting(true)

    try {
      await quizService.remove(quizToDelete.id)

      setQuizzes((current) =>
        current.filter((quiz) => quiz.id !== quizToDelete.id),
      )

      setQuizToDelete(null)
      setSuccessMessage("Quiz eliminato correttamente.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nell'eliminazione quiz"

      setError(message)
    } finally {
      setIsDeleting(false)
    }
  }

  function openCreateModal() {
    setIsCreateModalOpen(true)
    setError("")
    setSuccessMessage("")
  }

  function closeCreateModal() {
    setIsCreateModalOpen(false)
  }

  function openEditModal(quiz: Quiz) {
    setQuizToEdit(quiz)
    setError("")
    setSuccessMessage("")
  }

  function closeEditModal() {
    setQuizToEdit(null)
  }

  function openDeleteModal(quiz: Quiz) {
    setError("")
    setSuccessMessage("")

    if (quiz.questionCount > 0 || quiz.hasResults || quiz.usedInChapters) {
      setQuizBlockedByRelations(quiz)
      return
    }

    setQuizToDelete(quiz)
  }

  function closeDeleteModal() {
    setQuizToDelete(null)
  }

  function closeBlockedByRelationsModal() {
    setQuizBlockedByRelations(null)
  }

  return {
    quizzes,
    questionsByQuizId,
    setQuestionsByQuizId,
    expandedQuizId,
    isCreateModalOpen,
    quizToEdit,
    quizToDelete,
    quizBlockedByRelations,
    isLoadingQuizzes,
    loadingQuestionsQuizId,
    isCreating,
    isUpdating,
    isDeleting,
    error,
    successMessage,
    loadQuestionsForQuiz,
    toggleQuizAccordion,
    refreshQuiz,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    openCreateModal,
    closeCreateModal,
    openEditModal,
    closeEditModal,
    openDeleteModal,
    closeDeleteModal,
    closeBlockedByRelationsModal,
  }
}
