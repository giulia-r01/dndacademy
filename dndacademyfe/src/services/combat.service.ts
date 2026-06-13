import { apiFetch } from "@/services/api"
import type { AttackRequest, Combat, CombatStatus } from "@/types/combat"

export const combatService = {
  start(campaignId: number) {
    return apiFetch<Combat>(`/api/combat/start/${campaignId}`, {
      method: "POST",
      auth: true,
    })
  },

  getCurrentTurn(combatId: number) {
    return apiFetch<number>(`/api/combat/${combatId}/current`, {
      method: "GET",
      auth: true,
    })
  },

  nextTurn(combatId: number) {
    return apiFetch<void>(`/api/combat/${combatId}/next`, {
      method: "POST",
      auth: true,
    })
  },

  getStatus(combatId: number) {
    return apiFetch<CombatStatus>(`/api/combat/${combatId}/status`, {
      method: "GET",
      auth: true,
    })
  },

  attack(payload: AttackRequest) {
    return apiFetch<string>("/api/characters/attack", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    })
  },
}
