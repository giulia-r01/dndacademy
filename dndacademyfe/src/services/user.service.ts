import { apiFetch } from "@/services/api"
import type { UserProfile } from "@/types/user"

export const userService = {
  getMe() {
    return apiFetch<UserProfile>("/api/users/me", {
      method: "GET",
      auth: true,
    })
  },
}
