export interface Campaign {
  id: number
  name: string
  description: string | null
  masterUsername: string
}

export interface CreateCampaignRequest {
  name: string
  description: string
}

export interface PartyMember {
  playerUsername: string
  characterName: string
  characterClass: string
  level: number
}
