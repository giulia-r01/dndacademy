export type CombatActionType = "WEAPON" | "SPELL"

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

  spellcaster: boolean
  weaponName: string
  damageDie: number
  spellName: string | null
  spellDamageDie: number
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
  actionType: CombatActionType
}

export interface AttackResult {
  hit: boolean
  critical: boolean
  actionName: string
  attackRoll: number
  abilityModifier: number
  totalAttack: number
  targetArmorClass: number
  damage: number
  targetRemainingHp: number
  targetDefeated: boolean
  combatOver: boolean
  winnerCharacterId: number | null
  nextTurnCharacterId: number | null
  message: string
  actionType: CombatActionType
  damageDie: number
  damageRoll: number
}
