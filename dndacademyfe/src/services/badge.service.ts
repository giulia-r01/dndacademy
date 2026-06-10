import { apiFetch } from "@/services/api"
import type { Badge } from "@/types/badge"

export const badgeService = {
  getMyBadges() {
    return apiFetch<Badge[]>("/api/badges/me", {
      method: "GET",
      auth: true,
    })
  },
}
