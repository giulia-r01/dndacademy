import { apiFetch } from "@/services/api"
import type {
  Character,
  CreateCharacterRequest,
  UpdateCharacterRequest,
} from "@/types/character"

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

  getAllByCampaignForAdmin(campaignId: number) {
    return apiFetch<Character[]>(
      `/api/characters/campaign/${campaignId}/admin`,
      {
        method: "GET",
        auth: true,
      },
    )
  },

  create(payload: CreateCharacterRequest) {
    return apiFetch<Character>("/api/characters", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  update(characterId: number, payload: UpdateCharacterRequest) {
    return apiFetch<Character>(`/api/characters/${characterId}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  remove(characterId: number) {
    return apiFetch<void>(`/api/characters/${characterId}`, {
      method: "DELETE",
      auth: true,
    })
  },

  uploadImage(characterId: number, file: File) {
    const formData = new FormData()
    formData.append("file", file)

    return apiFetch<Character>(`/api/characters/${characterId}/image`, {
      method: "PATCH",
      auth: true,
      body: formData,
    })
  },

  claim(characterId: number) {
    return apiFetch<Character>(`/api/characters/${characterId}/claim`, {
      method: "PATCH",
      auth: true,
    })
  },
}
