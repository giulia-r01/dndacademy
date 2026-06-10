import { apiFetch } from "@/services/api"
import type {
  Question,
  Quiz,
  QuizResult,
  SubmitQuizRequest,
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
}
