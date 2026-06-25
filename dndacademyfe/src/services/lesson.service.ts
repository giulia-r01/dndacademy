import { apiFetch } from "@/services/api"
import type {
  CreateLessonRequest,
  Lesson,
  UpdateLessonRequest,
  UserLessonProgress,
} from "@/types/lesson"

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

  create(request: CreateLessonRequest) {
    return apiFetch<Lesson>("/api/lessons", {
      method: "POST",
      auth: true,
      body: JSON.stringify(request),
    })
  },

  update(id: number, request: UpdateLessonRequest) {
    return apiFetch<Lesson>(`/api/lessons/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(request),
    })
  },

  remove(id: number) {
    return apiFetch<void>(`/api/lessons/${id}`, {
      method: "DELETE",
      auth: true,
    })
  },
}
