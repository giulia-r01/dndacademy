import { apiFetch } from "@/services/api"
import type {
  Badge,
  CreateBadgeRequest,
  UpdateBadgeRequest,
} from "@/types/badge"

export const badgeService = {
  getAll() {
    return apiFetch<Badge[]>("/api/badges", {
      method: "GET",
      auth: true,
    })
  },

  getMine() {
    return apiFetch<Badge[]>("/api/badges/me", {
      method: "GET",
      auth: true,
    })
  },

  create(request: CreateBadgeRequest) {
    return apiFetch<Badge>("/api/badges", {
      method: "POST",
      auth: true,
      body: JSON.stringify(request),
    })
  },

  update(id: number, request: UpdateBadgeRequest) {
    return apiFetch<Badge>(`/api/badges/${id}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(request),
    })
  },

  remove(id: number) {
    return apiFetch<void>(`/api/badges/${id}`, {
      method: "DELETE",
      auth: true,
    })
  },
}
