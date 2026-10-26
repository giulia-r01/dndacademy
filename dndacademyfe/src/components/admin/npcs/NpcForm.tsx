"use client"

import { useEffect, useState, type FormEvent } from "react"
import AppButton from "@/components/common/AppButton"
import EntityPortrait from "@/components/common/EntityPortrait"
import FormInput from "@/components/common/FormInput"
import type { Npc, NpcRequest } from "@/types/npc"

const DICE = [4, 6, 8, 10, 12]
const EMPTY: NpcRequest = { name: "", description: "", maxHp: 10, armorClass: 12, dexterity: 10, attackModifier: 2, damageDie: 6, damageModifier: 0, enemy: true }
type Props = { initial?: Npc | null; isSaving: boolean; error: string; onSave: (request: NpcRequest, image: File | null) => Promise<boolean>; onCancel: () => void }

export default function NpcForm({ initial, isSaving, error, onSave, onCancel }: Props) {
  const [values, setValues] = useState<NpcRequest>(initial ? {
    name: initial.name, description: initial.description ?? "", maxHp: initial.maxHp,
    armorClass: initial.armorClass, dexterity: initial.dexterity, attackModifier: initial.attackModifier,
    damageDie: initial.damageDie, damageModifier: initial.damageModifier, enemy: initial.enemy,
  } : EMPTY)
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(initial?.imageUrl ?? null)
  const [validationError, setValidationError] = useState("")
  useEffect(() => () => { if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview) }, [preview])
  function setField<K extends keyof NpcRequest>(key: K, value: NpcRequest[K]) { setValues(prev => ({ ...prev, [key]: value })) }
  function selectImage(file: File | undefined) {
    if (!file) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setValidationError("Scegli un'immagine JPG, PNG o WEBP fino a 5 MB.")
      return
    }
    setValidationError("")
    setImage(file)
    setPreview(URL.createObjectURL(file))
  }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!values.name.trim() || values.name.length > 255 || (values.description ?? "").length > 1000 ||
      !DICE.includes(values.damageDie) || [values.maxHp, values.armorClass, values.dexterity].some(n => !Number.isInteger(n) || n < 1) ||
      [values.attackModifier, values.damageModifier].some(n => !Number.isInteger(n))) {
      setValidationError("Controlla nome e statistiche: HP, CA e Destrezza devono essere interi positivi; i dadi ammessi sono d4, d6, d8, d10 e d12.")
      return
    }
    setValidationError("")
    await onSave({ ...values, name: values.name.trim(), description: values.description?.trim() || null }, image)
  }
  const selectClass = "mt-2 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)]"
  return <form onSubmit={submit} className="space-y-6">
    <fieldset disabled={isSaving} className="grid min-w-0 gap-6 lg:grid-cols-[248px_minmax(0,1fr)]">
      <section className="space-y-3">
        <h3 className="text-lg font-black">Ritratto</h3>
        <EntityPortrait name={values.name || "NPC"} imageUrl={preview} className="h-[380px] w-full" />
        <label className="block text-sm font-bold" htmlFor="npc-image">Immagine del nemico o aiutante</label>
        <input id="npc-image" type="file" accept="image/jpeg,image/png,image/webp" className="block w-full text-sm" onChange={e => { selectImage(e.target.files?.[0]); e.target.value = "" }} />
        <p className="text-xs text-[var(--text-muted)]">JPG, PNG o WEBP · massimo 5 MB. Il ritratto viene salvato insieme alla scheda.</p>
      </section>
      <div className="min-w-0 space-y-6">
        <section className="space-y-4">
          <h3 className="text-lg font-black">Identità</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Nome" name="npc-name" value={values.name} required maxLength={255} onChange={e => setField("name", e.target.value)} />
            <label className="block text-sm font-bold">Schieramento<select aria-label="Schieramento" className={selectClass} value={values.enemy ? "enemy" : "ally"} onChange={e => setField("enemy", e.target.value === "enemy")}><option value="enemy">Nemico</option><option value="ally">Aiutante</option></select></label>
          </div>
          <label className="block text-sm font-bold">Descrizione<textarea rows={3} maxLength={1000} className={selectClass} value={values.description ?? ""} onChange={e => setField("description", e.target.value)} /></label>
        </section>
        <section className="space-y-4">
          <h3 className="text-lg font-black">Difesa</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="HP massimi" name="npc-hp" type="number" min={1} step={1} required value={values.maxHp} onChange={e => setField("maxHp", Number(e.target.value))} />
            <FormInput label="Classe Armatura" name="npc-ac" type="number" min={1} step={1} required value={values.armorClass} onChange={e => setField("armorClass", Number(e.target.value))} />
          </div>
        </section>
        <section className="space-y-4">
          <h3 className="text-lg font-black">Statistiche e attacco</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <FormInput label="Destrezza" name="npc-dex" type="number" min={1} step={1} required value={values.dexterity} onChange={e => setField("dexterity", Number(e.target.value))} />
            <FormInput label="Modificatore attacco" name="npc-attack" type="number" step={1} required value={values.attackModifier} onChange={e => setField("attackModifier", Number(e.target.value))} />
            <label className="block text-sm font-bold">Dado danno<select aria-label="Dado danno" className={selectClass} value={values.damageDie} onChange={e => setField("damageDie", Number(e.target.value))}>{DICE.map(die => <option key={die} value={die}>d{die}</option>)}</select></label>
            <FormInput label="Modificatore danni" name="npc-damage" type="number" step={1} required value={values.damageModifier} onChange={e => setField("damageModifier", Number(e.target.value))} />
          </div>
        </section>
      </div>
    </fieldset>
    {(validationError || error) && <p role="alert" className="text-sm text-[var(--danger)]">{validationError || error}</p>}
    <div className="flex flex-col-reverse gap-3 border-t border-[var(--border-teal-soft)] pt-4 sm:flex-row sm:justify-end">
      <AppButton type="button" variant="secondary" disabled={isSaving} onClick={onCancel}>Annulla</AppButton>
      <AppButton type="submit" disabled={isSaving}>{isSaving ? "Salvataggio..." : initial ? "Salva modifiche" : "Crea NPC"}</AppButton>
    </div>
  </form>
}
