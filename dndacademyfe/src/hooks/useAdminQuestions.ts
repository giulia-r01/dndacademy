import { useState } from "react"
import { questionService } from "@/services/question.service"
import type {
  AdminAnswer,
  AdminQuestion,
  CreateAnswerRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest,
} from "@/types/quiz"

type UseAdminQuestionsProps = {
  questionsByQuizId: Record<number, AdminQuestion[]>
  setQuestionsByQuizId: React.Dispatch<
    React.SetStateAction<Record<number, AdminQuestion[]>>
  >
  refreshQuiz: (quizId: number) => Promise<void>
}

export function useAdminQuestions({
  setQuestionsByQuizId,
  refreshQuiz,
}: UseAdminQuestionsProps) {
  const [questionToEdit, setQuestionToEdit] = useState<AdminQuestion | null>(
    null,
  )
  const [questionToDelete, setQuestionToDelete] =
    useState<AdminQuestion | null>(null)

  const [selectedQuizId, setSelectedQuizId] = useState<number | null>(null)

  const [isQuestionCreateModalOpen, setIsQuestionCreateModalOpen] =
    useState(false)

  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false)
  const [isUpdatingQuestion, setIsUpdatingQuestion] = useState(false)
  const [isDeletingQuestion, setIsDeletingQuestion] = useState(false)

  const [questionError, setQuestionError] = useState("")
  const [questionSuccessMessage, setQuestionSuccessMessage] = useState("")

  const [answerToEdit, setAnswerToEdit] = useState<AdminAnswer | null>(null)
  const [answerToDelete, setAnswerToDelete] = useState<AdminAnswer | null>(null)
  const [selectedQuestionId, setSelectedQuestionId] = useState<number | null>(
    null,
  )

  const [isUpdatingAnswer, setIsUpdatingAnswer] = useState(false)
  const [isDeletingAnswer, setIsDeletingAnswer] = useState(false)

  const [isEditingOnlyCorrectAnswer, setIsEditingOnlyCorrectAnswer] =
    useState(false)

  function openCreateQuestionModal(quizId: number) {
    setSelectedQuizId(quizId)
    setIsQuestionCreateModalOpen(true)
    setQuestionError("")
    setQuestionSuccessMessage("")
  }

  function closeCreateQuestionModal() {
    setIsQuestionCreateModalOpen(false)
    setSelectedQuizId(null)
  }

  function openEditQuestionModal(question: AdminQuestion, quizId: number) {
    setQuestionToEdit(question)
    setSelectedQuizId(quizId)
    setQuestionError("")
    setQuestionSuccessMessage("")
  }

  function closeEditQuestionModal() {
    setQuestionToEdit(null)
  }

  function openDeleteQuestionModal(question: AdminQuestion, quizId: number) {
    setQuestionToDelete(question)
    setSelectedQuizId(quizId)
    setQuestionError("")
    setQuestionSuccessMessage("")
  }

  function closeDeleteQuestionModal() {
    setQuestionToDelete(null)
    setSelectedQuizId(null)
  }

  function openEditAnswerModal(
    answer: AdminAnswer,
    question: AdminQuestion,
    quizId: number,
  ) {
    const correctAnswersCount = question.answers.filter(
      (currentAnswer) => currentAnswer.correct,
    ).length

    setAnswerToEdit(answer)
    setSelectedQuestionId(question.id)
    setSelectedQuizId(quizId)
    setIsEditingOnlyCorrectAnswer(answer.correct && correctAnswersCount === 1)
    setQuestionError("")
    setQuestionSuccessMessage("")
  }

  function closeEditAnswerModal() {
    setAnswerToEdit(null)
    setSelectedQuestionId(null)
    setIsEditingOnlyCorrectAnswer(false)
  }

  function openDeleteAnswerModal(
    answer: AdminAnswer,
    questionId: number,
    quizId: number,
  ) {
    setAnswerToDelete(answer)
    setSelectedQuestionId(questionId)
    setSelectedQuizId(quizId)
    setQuestionError("")
    setQuestionSuccessMessage("")
  }

  function closeDeleteAnswerModal() {
    setAnswerToDelete(null)
    setSelectedQuestionId(null)
  }

  async function createQuestion(request: CreateQuestionRequest) {
    setQuestionError("")
    setQuestionSuccessMessage("")
    setIsCreatingQuestion(true)

    try {
      await questionService.createQuestion(request)

      const questions = await questionService.getAdminQuestionsByQuiz(
        request.quizId,
      )

      setQuestionsByQuizId((current) => ({
        ...current,
        [request.quizId]: questions,
      }))

      await refreshQuiz(request.quizId)

      setQuestionSuccessMessage("Domanda creata correttamente.")
      closeCreateQuestionModal()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella creazione domanda"

      setQuestionError(message)
    } finally {
      setIsCreatingQuestion(false)
    }
  }

  async function updateQuestion(
    questionId: number,
    request: UpdateQuestionRequest,
  ) {
    if (!selectedQuizId) {
      return
    }

    setQuestionError("")
    setQuestionSuccessMessage("")
    setIsUpdatingQuestion(true)

    try {
      await questionService.updateQuestion(questionId, request)

      const questions =
        await questionService.getAdminQuestionsByQuiz(selectedQuizId)

      setQuestionsByQuizId((current) => ({
        ...current,
        [selectedQuizId]: questions,
      }))

      setQuestionSuccessMessage("Domanda aggiornata correttamente.")
      closeEditQuestionModal()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella modifica domanda"

      setQuestionError(message)
    } finally {
      setIsUpdatingQuestion(false)
    }
  }

  async function deleteQuestion() {
    if (!questionToDelete || !selectedQuizId) {
      return
    }

    setQuestionError("")
    setQuestionSuccessMessage("")
    setIsDeletingQuestion(true)

    try {
      await questionService.deleteQuestion(questionToDelete.id)

      const questions =
        await questionService.getAdminQuestionsByQuiz(selectedQuizId)

      setQuestionsByQuizId((current) => ({
        ...current,
        [selectedQuizId]: questions,
      }))

      await refreshQuiz(selectedQuizId)

      setQuestionSuccessMessage("Domanda eliminata correttamente.")
      closeDeleteQuestionModal()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nell'eliminazione domanda"

      setQuestionError(message)
    } finally {
      setIsDeletingQuestion(false)
    }
  }

  async function updateAnswer(answerId: number, request: CreateAnswerRequest) {
    if (!selectedQuizId || !selectedQuestionId) {
      return
    }

    setQuestionError("")
    setQuestionSuccessMessage("")
    setIsUpdatingAnswer(true)

    try {
      const updatedQuestion = await questionService.updateAnswer(
        selectedQuestionId,
        answerId,
        request,
      )

      setQuestionsByQuizId((current) => ({
        ...current,
        [selectedQuizId]: current[selectedQuizId].map((question) =>
          question.id === updatedQuestion.id ? updatedQuestion : question,
        ),
      }))

      setQuestionSuccessMessage("Risposta aggiornata correttamente.")
      closeEditAnswerModal()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nella modifica risposta"

      setQuestionError(message)
    } finally {
      setIsUpdatingAnswer(false)
    }
  }

  async function deleteAnswer() {
    if (!selectedQuizId || !selectedQuestionId || !answerToDelete) {
      return
    }

    setQuestionError("")
    setQuestionSuccessMessage("")
    setIsDeletingAnswer(true)

    try {
      const updatedQuestion = await questionService.deleteAnswer(
        selectedQuestionId,
        answerToDelete.id,
      )

      setQuestionsByQuizId((current) => ({
        ...current,
        [selectedQuizId]: current[selectedQuizId].map((question) =>
          question.id === updatedQuestion.id ? updatedQuestion : question,
        ),
      }))

      setQuestionSuccessMessage("Risposta eliminata correttamente.")
      closeDeleteAnswerModal()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore nell'eliminazione risposta"

      setQuestionError(message)
    } finally {
      setIsDeletingAnswer(false)
    }
  }

  return {
    questionToEdit,
    questionToDelete,
    selectedQuizId,
    isQuestionCreateModalOpen,
    isCreatingQuestion,
    isUpdatingQuestion,
    isDeletingQuestion,
    questionError,
    questionSuccessMessage,
    openCreateQuestionModal,
    closeCreateQuestionModal,
    openEditQuestionModal,
    closeEditQuestionModal,
    openDeleteQuestionModal,
    closeDeleteQuestionModal,
    createQuestion,
    updateQuestion,
    deleteQuestion,

    answerToEdit,
    answerToDelete,
    selectedQuestionId,
    isUpdatingAnswer,
    isDeletingAnswer,
    isEditingOnlyCorrectAnswer,
    openEditAnswerModal,
    closeEditAnswerModal,
    openDeleteAnswerModal,
    closeDeleteAnswerModal,
    updateAnswer,
    deleteAnswer,
  }
}
