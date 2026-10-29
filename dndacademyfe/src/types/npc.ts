export interface Npc {
  id: number
  imageUrl: string | null
  name: string
  description: string | null
  maxHp: number
  armorClass: number
  dexterity: number
  attackModifier: number
  damageDie: number
  damageModifier: number
  healer?: boolean
  healingDie?: number
  healingModifier?: number
  healingUses?: number
  enemy: boolean
}

export type NpcRequest = Omit<Npc, "id" | "imageUrl">
