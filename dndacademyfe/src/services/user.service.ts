import { apiFetch } from "@/services/api"
import type { ChangePasswordRequest, UpdateProfileRequest, UserProfile, UserRole } from "@/types/user"

export const userService = {
  updateMe(request: UpdateProfileRequest) {
    return apiFetch<UserProfile>("/api/users/me", { method: "PATCH", auth: true, body: JSON.stringify(request) })
  },
  changePassword(request: ChangePasswordRequest) {
    return apiFetch<void>("/api/users/me/password", { method: "PUT", auth: true, body: JSON.stringify(request) })
  },
  uploadAvatar(file: File) {
    const body = new FormData()
    body.append("file", file)
    return apiFetch<UserProfile>("/api/users/me/avatar", { method: "PUT", auth: true, body })
  },
  removeAvatar() {
    return apiFetch<UserProfile>("/api/users/me/avatar", { method: "DELETE", auth: true })
  },
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
