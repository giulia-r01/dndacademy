export type AttackAbility =
  | "STRENGTH"
  | "DEXTERITY"
  | "INTELLIGENCE"
  | "WISDOM"
  | "CHARISMA"

export interface CharacterStats {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
}

export interface CreateCharacterRequest {
  name: string
  race: string
  characterClass: string
  level: number
  campaignId: number
  maxHp: number
  armorClass: number
  weaponName: string
  damageDie: number
  attackAbility: AttackAbility
  spellcaster: boolean
  spellName: string | null
  spellDamageDie: number
  spellAbility: AttackAbility | null
  stats: CharacterStats
}

export interface UpdateCharacterRequest {
  name: string
  race: string
  characterClass: string
  level: number
  maxHp: number
  armorClass: number
  weaponName: string
  damageDie: number
  attackAbility: AttackAbility
  spellcaster: boolean
  spellName: string | null
  spellDamageDie: number
  spellAbility: AttackAbility | null
  stats: CharacterStats
}

export interface Character {
  id: number
  name: string
  race: string
  characterClass: string
  level: number
  maxHp: number
  currentHp: number
  armorClass: number
  playerUsername: string | null
  campaignId: number

  imageUrl: string | null

  weaponName: string
  damageDie: number
  attackAbility: AttackAbility

  spellcaster: boolean
  spellName: string | null
  spellDamageDie: number
  spellAbility: AttackAbility | null
  stats?: CharacterStats
}
