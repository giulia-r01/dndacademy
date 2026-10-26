"use client"

import { useState, type FormEvent } from "react"
import AppButton from "@/components/common/AppButton"
import type { Npc, NpcRequest } from "@/types/npc"

const DICE = [4, 6, 8, 10, 12]

const EMPTY: NpcRequest = {
  name: "",
  description: "",
  maxHp: 10,
  armorClass: 12,
  dexterity: 10,
  attackModifier: 2,
  damageDie: 6,
  damageModifier: 0,
  enemy: true,
}

type Props = {
  initial?: Npc | null
  isSaving: boolean
  error: string
  onSave: (request: NpcRequest) => Promise<boolean>
  onCancel: () => void
}

export default function NpcForm({
  initial,
  isSaving,
  error,
  onSave,
  onCancel,
}: Props) {
  const [values, setValues] = useState<NpcRequest>(
    initial
      ? {
          name: initial.name,
          description: initial.description ?? "",
          maxHp: initial.maxHp,
          armorClass: initial.armorClass,
          dexterity: initial.dexterity,
          attackModifier: initial.attackModifier,
          damageDie: initial.damageDie,
          damageModifier: initial.damageModifier,
          enemy: initial.enemy,
        }
      : EMPTY,
  )
  const [validationError, setValidationError] = useState("")

  function setField<K extends keyof NpcRequest>(key: K, value: NpcRequest[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (
      !values.name.trim() ||
      values.maxHp < 1 ||
      values.armorClass < 1 ||
      values.dexterity < 1 ||
      !DICE.includes(values.damageDie) ||
      !Number.isInteger(values.maxHp) ||
      !Number.isInteger(values.armorClass) ||
      !Number.isInteger(values.dexterity) ||
      !Number.isInteger(values.attackModifier) ||
      !Number.isInteger(values.damageModifier)
    ) {
      setValidationError(
        "Controlla nome e statistiche: HP, CA e Destrezza devono essere positivi; i dadi ammessi sono d4, d6, d8, d10 e d12.",
      )
      return
    }
    if ((values.description ?? "").length > 1000 || values.name.length > 255) {
      setValidationError("Nome o descrizione troppo lunghi.")
      return
    }
    setValidationError("")
    await onSave({
      ...values,
      name: values.name.trim(),
      description: values.description?.trim() || null,
    })
  }

  const inputClass =
    "mt-1 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-3 py-2 text-[var(--text-main)]"
  const numberFields: { key: keyof NpcRequest; label: string; min?: number }[] =
    [
      { key: "maxHp", label: "HP massimi", min: 1 },
      { key: "armorClass", label: "Classe armatura", min: 1 },
      { key: "dexterity", label: "Destrezza", min: 1 },
      { key: "attackModifier", label: "Modificatore attacco" },
      { key: "damageModifier", label: "Modificatore danni" },
    ]

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-bold">
        Nome *
        <input
          className={inputClass}
          value={values.name}
          onChange={(e) => setField("name", e.target.value)}
          required
          maxLength={255}
          disabled={isSaving}
        />
      </label>
      <label className="block text-sm font-bold">
        Descrizione
        <textarea
          className={inputClass}
          rows={3}
          value={values.description ?? ""}
          onChange={(e) => setField("description", e.target.value)}
          maxLength={1000}
          disabled={isSaving}
        />
      </label>
      <label className="block text-sm font-bold">
        Schieramento
        <select
          className={inputClass}
          value={values.enemy ? "enemy" : "ally"}
          onChange={(e) => setField("enemy", e.target.value === "enemy")}
          disabled={isSaving}
        >
          <option value="enemy">Nemico</option>
          <option value="ally">Alleato</option>
        </select>
      </label>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {numberFields.map(({ key, label, min }) => (
          <label key={key} className="block text-sm font-bold">
            {label} *
            <input
              type="number"
              step="1"
              min={min}
              required
              disabled={isSaving}
              className={inputClass}
              value={values[key] as number}
              onChange={(e) => setField(key, Number(e.target.value) as never)}
            />
          </label>
        ))}
        <label className="block text-sm font-bold">
          Dado danno *
          <select
            className={inputClass}
            value={values.damageDie}
            disabled={isSaving}
            onChange={(e) => setField("damageDie", Number(e.target.value))}
          >
            {DICE.map((die) => (
              <option key={die} value={die}>
                d{die}
              </option>
            ))}
          </select>
        </label>
      </div>
      {(validationError || error) && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {validationError || error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <AppButton
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSaving}
        >
          Annulla
        </AppButton>
        <AppButton type="submit" disabled={isSaving}>
          {isSaving
            ? "Salvataggio..."
            : initial
              ? "Salva modifiche"
              : "Crea NPC"}
        </AppButton>
      </div>
    </form>
  )
}
