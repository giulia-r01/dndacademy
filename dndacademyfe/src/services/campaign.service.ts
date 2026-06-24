import { apiFetch } from "@/services/api"
import type {
  Campaign,
  CreateCampaignRequest,
  PartyMember,
} from "@/types/campaign"
import type {
  CampaignChapter,
  CampaignChapterPlayer,
  CreateCampaignChapterRequest,
} from "@/types/campaign-chapter"
import type { CampaignProgress } from "@/types/campaign-progress"

export const campaignService = {
  getAll() {
    return apiFetch<Campaign[]>("/api/campaigns", {
      method: "GET",
      auth: true,
    })
  },

  create(payload: CreateCampaignRequest) {
    return apiFetch<Campaign>("/api/campaigns", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  join(campaignId: number) {
    return apiFetch<Campaign>(`/api/campaigns/${campaignId}/join`, {
      method: "POST",
      auth: true,
    })
  },

  getPlayers(campaignId: number) {
    return apiFetch<string[]>(`/api/campaigns/${campaignId}/players`, {
      method: "GET",
      auth: true,
    })
  },

  getParty(campaignId: number) {
    return apiFetch<PartyMember[]>(`/api/campaigns/${campaignId}/party`, {
      method: "GET",
      auth: true,
    })
  },

  update(campaignId: number, payload: CreateCampaignRequest) {
    return apiFetch<Campaign>(`/api/campaigns/${campaignId}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  remove(campaignId: number) {
    return apiFetch<void>(`/api/campaigns/${campaignId}`, {
      method: "DELETE",
      auth: true,
    })
  },

  getMyProgress() {
    return apiFetch<CampaignProgress[]>("/api/campaigns/me/progress", {
      method: "GET",
      auth: true,
    })
  },

  getChaptersByCampaign(campaignId: number) {
    return apiFetch<CampaignChapter[]>(
      `/api/campaigns/${campaignId}/chapters`,
      {
        method: "GET",
        auth: true,
      },
    )
  },

  createChapter(campaignId: number, payload: CreateCampaignChapterRequest) {
    return apiFetch<CampaignChapter>(
      `/api/campaigns/${campaignId}/chapters`,
      {
        method: "POST",
        auth: true,
        body: JSON.stringify(payload),
      },
    )
  },

  updateChapter(chapterId: number, payload: CreateCampaignChapterRequest) {
    return apiFetch<CampaignChapter>(`/api/campaigns/chapters/${chapterId}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  deleteChapter(chapterId: number) {
    return apiFetch<void>(`/api/campaigns/chapters/${chapterId}`, {
      method: "DELETE",
      auth: true,
    })
  },

  getPlayerChapters(campaignId: number) {
    return apiFetch<CampaignChapterPlayer[]>(
      `/api/campaigns/${campaignId}/chapters/player`,
      {
        method: "GET",
        auth: true,
      },
    )
  },
}
