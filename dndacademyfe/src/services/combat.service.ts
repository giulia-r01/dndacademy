import { apiFetch } from "@/services/api"
import type {
  AttackRequest,
  AttackResult,
  Combat,
  CombatStatus,
} from "@/types/combat"

export const combatService = {
  startChapter(chapterId: number) {
    return apiFetch<Combat>(`/api/combat/chapter/${chapterId}/start`, {
      method: "POST",
      auth: true,
    })
  },

  advanceNpcTurn(combatId: number, expectedEventCount: number) {
    return apiFetch<CombatStatus>(`/api/combat/${combatId}/npc-turn?expectedEventCount=${expectedEventCount}`, {
      method: "POST", auth: true,
    })
  },

  getCurrentTurn(combatId: number) {
    return apiFetch<number | null>(`/api/combat/${combatId}/current`, {
      method: "GET",
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
    return apiFetch<AttackResult>(`/api/combat/${payload.combatId}/attack`, {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    })
  },
}
