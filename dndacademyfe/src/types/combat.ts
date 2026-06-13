export interface Combat {
  id: number
  campaignId: number
  turnOrder: number[]
  currentTurnIndex: number
  initiativeRolls: number[]
}

export interface CombatFighter {
  characterId: number
  name: string
  characterClass: string
  currentHp: number
  maxHp: number
  armorClass: number
  alive: boolean
  currentTurn: boolean
  initiative: number
}

export interface CombatStatus {
  combatId: number
  campaignId: number
  currentTurnCharacterId: number
  combatOver: boolean
  winnerCharacterId: number | null
  fighters: CombatFighter[]
}

export interface AttackRequest {
  attackerId: number
  targetId: number
  combatId: number
}
