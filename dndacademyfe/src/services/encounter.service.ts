import { apiFetch } from "@/services/api"

import type { Encounter, EncounterRequest } from "@/types/encounter"

export const encounterService = {
  getByChapter(chapterId: number) {
    return apiFetch<Encounter[]>(`/api/encounters/chapter/${chapterId}`, {
      method: "GET",
      auth: true,
    })
  },

  getById(encounterId: number) {
    return apiFetch<Encounter>(`/api/encounters/${encounterId}`, {
      method: "GET",
      auth: true,
    })
  },

  create(payload: EncounterRequest) {
    return apiFetch<Encounter>("/api/encounters", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  update(encounterId: number, payload: EncounterRequest) {
    return apiFetch<Encounter>(`/api/encounters/${encounterId}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  delete(encounterId: number) {
    return apiFetch<void>(`/api/encounters/${encounterId}`, {
      method: "DELETE",
      auth: true,
    })
  },
}
