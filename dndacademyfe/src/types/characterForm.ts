import type { AttackAbility } from "@/types/character"

export type CharacterFormValues = {
  name: string
  race: string
  characterClass: string
  level: number

  maxHp: number
  armorClass: number

  strength: number
  dexterity: number
  constitution: number
  intelligence: number
  wisdom: number
  charisma: number

  weaponName: string
  damageDie: number
  attackAbility: AttackAbility

  spellcaster: boolean
  spellName: string
  spellDamageDie: number
  spellAbility: AttackAbility

  imageFile: File | null
}
