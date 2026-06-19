import { useState } from "react"

import type {
  Character,
  CreateCharacterRequest,
  UpdateCharacterRequest,
} from "@/types/character"
import type { CharacterFormValues } from "@/types/characterForm"

const initialCharacterFormValues: CharacterFormValues = {
  name: "",
  race: "",
  characterClass: "",
  level: 1,

  maxHp: 10,
  armorClass: 10,

  strength: 10,
  dexterity: 10,
  constitution: 10,
  intelligence: 10,
  wisdom: 10,
  charisma: 10,

  weaponName: "",
  damageDie: 6,
  attackAbility: "STRENGTH",

  spellcaster: false,
  spellName: "",
  spellDamageDie: 6,
  spellAbility: "INTELLIGENCE",

  imageFile: null,
}

export function useCharacterForm() {
  const [values, setValues] = useState<CharacterFormValues>(
    initialCharacterFormValues,
  )

  function updateField<K extends keyof CharacterFormValues>(
    field: K,
    value: CharacterFormValues[K],
  ) {
    setValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function resetForm() {
    setValues(initialCharacterFormValues)
  }

  function buildCreatePayload(campaignId: number): CreateCharacterRequest {
    return {
      name: values.name.trim(),
      race: values.race.trim(),
      characterClass: values.characterClass.trim(),
      level: values.level,
      campaignId,
      maxHp: values.maxHp,
      armorClass: values.armorClass,
      weaponName: values.weaponName.trim(),
      damageDie: values.damageDie,
      attackAbility: values.attackAbility,
      spellcaster: values.spellcaster,
      spellName: values.spellcaster ? values.spellName.trim() : null,
      spellDamageDie: values.spellcaster ? values.spellDamageDie : 0,
      spellAbility: values.spellcaster ? values.spellAbility : null,
      stats: {
        strength: values.strength,
        dexterity: values.dexterity,
        constitution: values.constitution,
        intelligence: values.intelligence,
        wisdom: values.wisdom,
        charisma: values.charisma,
      },
    }
  }

  function buildUpdatePayload(): UpdateCharacterRequest {
    return {
      name: values.name.trim(),
      race: values.race.trim(),
      characterClass: values.characterClass.trim(),
      level: values.level,
      maxHp: values.maxHp,
      armorClass: values.armorClass,
      weaponName: values.weaponName.trim(),
      damageDie: values.damageDie,
      attackAbility: values.attackAbility,
      spellcaster: values.spellcaster,
      spellName: values.spellcaster ? values.spellName.trim() : null,
      spellDamageDie: values.spellcaster ? values.spellDamageDie : 0,
      spellAbility: values.spellcaster ? values.spellAbility : null,
      stats: {
        strength: values.strength,
        dexterity: values.dexterity,
        constitution: values.constitution,
        intelligence: values.intelligence,
        wisdom: values.wisdom,
        charisma: values.charisma,
      },
    }
  }

  function validateForm() {
    if (!values.name.trim()) {
      return "Il nome è obbligatorio."
    }

    if (!values.race.trim()) {
      return "La razza è obbligatoria."
    }

    if (!values.characterClass.trim()) {
      return "La classe è obbligatoria."
    }

    if (!values.weaponName.trim()) {
      return "Il nome dell'arma è obbligatorio."
    }

    if (values.spellcaster && !values.spellName.trim()) {
      return "Il nome dell'incantesimo è obbligatorio per gli spellcaster."
    }

    return null
  }

  function fillFormFromCharacter(character: Character) {
    setValues({
      name: character.name,
      race: character.race,
      characterClass: character.characterClass,
      level: character.level,

      maxHp: character.maxHp,
      armorClass: character.armorClass,

      strength: character.stats?.strength ?? 10,
      dexterity: character.stats?.dexterity ?? 10,
      constitution: character.stats?.constitution ?? 10,
      intelligence: character.stats?.intelligence ?? 10,
      wisdom: character.stats?.wisdom ?? 10,
      charisma: character.stats?.charisma ?? 10,

      weaponName: character.weaponName,
      damageDie: character.damageDie,
      attackAbility: character.attackAbility,

      spellcaster: character.spellcaster,
      spellName: character.spellName ?? "",
      spellDamageDie: character.spellDamageDie || 6,
      spellAbility: character.spellAbility ?? "INTELLIGENCE",

      imageFile: null,
    })
  }

  return {
    values,
    updateField,
    resetForm,
    buildCreatePayload,
    buildUpdatePayload,
    validateForm,
    fillFormFromCharacter,
  }
}
