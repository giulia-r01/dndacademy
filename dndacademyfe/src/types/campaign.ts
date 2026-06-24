export type CampaignDifficulty = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"

export type Campaign = {
  id: number
  name: string
  description: string | null
  masterUsername: string
  difficulty: CampaignDifficulty
}

export interface CreateCampaignRequest {
  name: string
  description: string
  difficulty: CampaignDifficulty
}

export interface PartyMember {
  playerUsername: string
  characterName: string
  characterClass: string
  level: number
}
