import { apiFetch } from "@/services/api"
import type { Npc, NpcRequest } from "@/types/npc"

export const npcService = {
  uploadImage(npcId: number, file: File) {
    const body = new FormData()
    body.append("file", file)
    return apiFetch<Npc>(`/api/npcs/${npcId}/image`, { method: "PATCH", auth: true, body })
  },

  getAll() {
    return apiFetch<Npc[]>("/api/npcs", {
      method: "GET",
      auth: true,
    })
  },

  getById(npcId: number) {
    return apiFetch<Npc>(`/api/npcs/${npcId}`, {
      method: "GET",
      auth: true,
    })
  },

  create(payload: NpcRequest) {
    return apiFetch<Npc>("/api/npcs", {
      method: "POST",
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  update(npcId: number, payload: NpcRequest) {
    return apiFetch<Npc>(`/api/npcs/${npcId}`, {
      method: "PUT",
      auth: true,
      body: JSON.stringify(payload),
    })
  },

  delete(npcId: number) {
    return apiFetch<void>(`/api/npcs/${npcId}`, {
      method: "DELETE",
      auth: true,
    })
  },
}
