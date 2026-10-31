import { apiFetch } from "@/services/api"
import type { UserProfile, UserRole } from "@/types/user"

export const userService = {
  getAll() {
    return apiFetch<UserProfile[]>("/api/users", { auth: true })
  },

  updateRole(id: number, role: UserRole) {
    return apiFetch<UserProfile>(`/api/users/${id}/role`, {
      method: "PATCH",
      auth: true,
      body: JSON.stringify({ role }),
    })
  },

  getMe() {
    return apiFetch<UserProfile>("/api/users/me", {
      method: "GET",
      auth: true,
    })
  },
}
