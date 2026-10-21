export type CombatActionType = "WEAPON" | "SPELL"
export type CombatOutcome = "PLAYER_VICTORY" | "ENEMY_VICTORY"

export interface Combat {
  id: number
  campaignId: number
  chapterId: number
  encounterId: number
  turnOrder: number[] // ID CombatParticipant
  currentTurnIndex: number
  completed: boolean
  outcome: CombatOutcome | null
  completedAt: string | null
}

export interface CombatFighter {
  participantId: number
  characterId: number | null
  npcId: number | null
  name: string
  characterClass: string
  currentHp: number
  maxHp: number
  armorClass: number
  alive: boolean
  enemy: boolean
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
  chapterId: number
  encounterId: number
  currentTurnParticipantId: number | null
  combatOver: boolean
  completed: boolean
  outcome: CombatOutcome | null
  completedAt: string | null
  fighters: CombatFighter[]
}

export interface AttackRequest {
  attackerId: number // CombatParticipant ID
  targetId: number // CombatParticipant ID
  combatId: number
  actionType: CombatActionType
}

export interface AttackResult {
  attackerId: number
  attackerName: string
  targetId: number
  targetName: string
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
  outcome: CombatOutcome | null
  nextTurnParticipantId: number | null
  message: string
  actionType: CombatActionType
  damageDie: number
  damageRoll: number
}
