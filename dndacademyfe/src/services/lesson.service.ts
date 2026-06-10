import { apiFetch } from "@/services/api"
import type { Lesson, UserLessonProgress } from "@/types/lesson"

export const lessonService = {
  getAll() {
    return apiFetch<Lesson[]>("/api/lessons", {
      method: "GET",
      auth: true,
    })
  },

  getById(id: number) {
    return apiFetch<Lesson>(`/api/lessons/${id}`, {
      method: "GET",
      auth: true,
    })
  },

  getMyProgress() {
    return apiFetch<UserLessonProgress[]>("/api/lessons/me/progress", {
      method: "GET",
      auth: true,
    })
  },
}
