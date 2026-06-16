import { apiFetch } from "@/services/api"
import type {
  Campaign,
  CreateCampaignRequest,
  PartyMember,
} from "@/types/campaign"

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
}
