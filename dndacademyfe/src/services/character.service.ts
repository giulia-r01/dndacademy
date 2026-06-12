import { apiFetch } from "@/services/api"
import type { Character } from "@/types/character"

export const characterService = {
  getMine() {
    return apiFetch<Character[]>("/api/characters/me", {
      method: "GET",
      auth: true,
    })
  },

  getByCampaign(campaignId: number) {
    return apiFetch<Character[]>(`/api/characters/campaign/${campaignId}`, {
      method: "GET",
      auth: true,
    })
  },

  getAvailableByCampaign(campaignId: number) {
    return apiFetch<Character[]>(
      `/api/characters/campaign/${campaignId}/available`,
      {
        method: "GET",
        auth: true,
      },
    )
  },

  claim(characterId: number) {
    return apiFetch<Character>(`/api/characters/${characterId}/claim`, {
      method: "PATCH",
      auth: true,
    })
  },
}
