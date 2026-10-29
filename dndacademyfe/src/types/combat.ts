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
  imageUrl: string | null
  characterClass: string
  currentHp: number
  maxHp: number
  armorClass: number
  alive: boolean
  enemy: boolean
  healer?: boolean
  healingUsesRemaining?: number
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
  campaignId: number | null
  chapterId: number | null
  encounterId: number | null
  currentTurnParticipantId: number | null
  combatOver: boolean
  completed: boolean
  outcome: CombatOutcome | null
  completedAt: string | null
  fighters: CombatFighter[]
  events: CombatEvent[]
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

export interface CombatEvent {
  actionType?: "ATTACK" | "HEAL" | null
  healing?: number
  healingRoll?: number
  healingDie?: number
  attackerId: number
  attackerName: string
  targetId: number
  targetName: string
  enemy: boolean
  hit: boolean
  critical: boolean
  attackRoll: number
  totalAttack: number
  targetArmorClass: number
  damage: number
  targetHpBefore: number
  targetRemainingHp: number
}

export interface CombatPreviewNpc {
  npc: import("@/types/npc").Npc
  quantity: number
}

export interface CombatPreview {
  chapterId: number
  campaignId: number
  campaignName: string
  chapterTitle: string
  title: string
  description: string | null
  participants: CombatPreviewNpc[]
}

export interface CombatHistoryEntry {
  combatId: number
  campaignId: number | null
  campaignName: string
  chapterId: number | null
  chapterTitle: string
  encounterTitle: string
  characterName: string | null
  characterImageUrl: string | null
  characterCurrentHp: number | null
  characterMaxHp: number | null
  completed: boolean
  outcome: CombatOutcome | null
  completedAt: string | null
}

export interface CombatHistoryPage {
  items: CombatHistoryEntry[]
  page: number
  size: number
  totalPages: number
  totalElements: number
}
