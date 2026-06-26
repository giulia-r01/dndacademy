import { apiFetch } from "@/services/api"
import type {
  CreateQuizRequest,
  Question,
  Quiz,
  QuizResult,
  SubmitQuizRequest,
  UpdateQuizRequest,
  UserQuizResult,
} from "@/types/quiz"

export const quizService = {
  getByLesson(lessonId: number) {
    return apiFetch<Quiz>(`/api/quizzes/lesson/${lessonId}`, {
      method: "GET",
      auth: true,
    })
  },

  getQuestionsByQuiz(quizId: number) {
    return apiFetch<Question[]>(`/api/questions/quiz/${quizId}`, {
      method: "GET",
      auth: true,
    })
  },

  getMyResults() {
    return apiFetch<UserQuizResult[]>("/api/quizzes/me/results", {
      method: "GET",
      auth: true,
    })
  },

  submit(payload: SubmitQuizRequest) {
    return apiFetch<QuizResult>("/api/quizzes/submit", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  getAll() {
    return apiFetch<Quiz[]>("/api/quizzes", {
      method: "GET",
      auth: true,
    })
  },

  getById(id: number) {
    return apiFetch<Quiz>(`/api/quizzes/${id}`, {
      method: "GET",
      auth: true,
    })
  },

  create(request: CreateQuizRequest) {
    return apiFetch<Quiz>("/api/quizzes", {
      method: "POST",
      auth: true,
      body: JSON.stringify(request),
    })
  },

  update(id: number, request: UpdateQuizRequest) {
    return apiFetch<Quiz>(`/api/quizzes/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(request),
    })
  },

  remove(id: number) {
    return apiFetch<void>(`/api/quizzes/${id}`, {
      method: "DELETE",
      auth: true,
    })
  },
}
