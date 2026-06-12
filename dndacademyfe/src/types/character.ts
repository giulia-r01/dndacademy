export interface CharacterStats {
  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number
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
}
