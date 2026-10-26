export interface EncounterNpc {
  npcId: number
  npcName: string
  enemy: boolean
  quantity: number
}

export interface EncounterNpcRequest {
  npcId: number
  quantity: number
}

export interface Encounter {
  id: number
  title: string
  description: string | null
  chapterId: number
  campaignId: number
  npcs: EncounterNpc[]
}

export interface EncounterRequest {
  title: string
  description: string | null
  chapterId: number
  npcs: EncounterNpcRequest[]
}
