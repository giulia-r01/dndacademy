import { apiFetch } from "@/services/api"
import type {
  AdminQuestion,
  CreateAnswerRequest,
  CreateQuestionRequest,
  UpdateQuestionRequest,
} from "@/types/quiz"

export const questionService = {
  getAdminQuestionsByQuiz(quizId: number) {
    return apiFetch<AdminQuestion[]>(`/api/questions/admin/quiz/${quizId}`, {
      method: "GET",
      auth: true,
    })
  },

  createQuestion(request: CreateQuestionRequest) {
    return apiFetch<AdminQuestion>("/api/questions", {
      method: "POST",
      auth: true,
      body: JSON.stringify(request),
    })
  },

  updateQuestion(questionId: number, request: UpdateQuestionRequest) {
    return apiFetch<AdminQuestion>(`/api/questions/${questionId}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(request),
    })
  },

  deleteQuestion(questionId: number) {
    return apiFetch<void>(`/api/questions/${questionId}`, {
      method: "DELETE",
      auth: true,
    })
  },

  createAnswer(questionId: number, request: CreateAnswerRequest) {
    return apiFetch<AdminQuestion>(`/api/questions/${questionId}/answers`, {
      method: "POST",
      auth: true,
      body: JSON.stringify(request),
    })
  },

  updateAnswer(
    questionId: number,
    answerId: number,
    request: CreateAnswerRequest,
  ) {
    return apiFetch<AdminQuestion>(
      `/api/questions/${questionId}/answers/${answerId}`,
      {
        method: "PUT",
        auth: true,
        body: JSON.stringify(request),
      },
    )
  },

  deleteAnswer(questionId: number, answerId: number) {
    return apiFetch<AdminQuestion>(
      `/api/questions/${questionId}/answers/${answerId}`,
      {
        method: "DELETE",
        auth: true,
      },
    )
  },
}
