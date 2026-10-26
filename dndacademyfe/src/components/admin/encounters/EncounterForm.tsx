"use client"

import { useState, type FormEvent } from "react"
import AppButton from "@/components/common/AppButton"
import type { Encounter, EncounterRequest } from "@/types/encounter"
import type { Npc } from "@/types/npc"

type Props = {
  chapterId: number
  initial: Encounter | null
  npcs: Npc[]
  isSaving: boolean
  error: string
  onSave: (request: EncounterRequest) => Promise<boolean>
  onCancel: () => void
}

export default function EncounterForm({
  chapterId,
  initial,
  npcs,
  isSaving,
  error,
  onSave,
  onCancel,
}: Props) {
  const [title, setTitle] = useState(initial?.title ?? "")
  const [description, setDescription] = useState(initial?.description ?? "")
  const [quantities, setQuantities] = useState<Record<number, number>>(() =>
    Object.fromEntries((initial?.npcs ?? []).map((n) => [n.npcId, n.quantity])),
  )
  const [validation, setValidation] = useState("")
  const inputClass =
    "mt-1 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-3 py-2 text-[var(--text-main)]"

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const selected = npcs.filter((n) => (quantities[n.id] ?? 0) > 0)
    if (
      !title.trim() ||
      title.length > 255 ||
      description.length > 2000 ||
      selected.length === 0 ||
      !selected.some((n) => n.enemy) ||
      selected.some(
        (n) =>
          !Number.isInteger(quantities[n.id]) ||
          quantities[n.id] < 1 ||
          quantities[n.id] > 20,
      )
    ) {
      setValidation(
        "Inserisci un titolo valido e seleziona almeno un nemico. Ogni quantità deve essere tra 1 e 20.",
      )
      return
    }
    setValidation("")
    await onSave({
      title: title.trim(),
      description: description.trim() || null,
      chapterId,
      npcs: selected.map((n) => ({ npcId: n.id, quantity: quantities[n.id] })),
    })
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <label className="block text-sm font-bold">
        Titolo incontro *
        <input
          required
          maxLength={255}
          className={inputClass}
          value={title}
          disabled={isSaving}
          onChange={(e) => setTitle(e.target.value)}
        />
      </label>
      <label className="block text-sm font-bold">
        Descrizione
        <textarea
          rows={3}
          maxLength={2000}
          className={inputClass}
          value={description}
          disabled={isSaving}
          onChange={(e) => setDescription(e.target.value)}
        />
      </label>
      <fieldset className="space-y-3">
        <legend className="font-bold">NPC partecipanti</legend>
        {npcs.length === 0 ? (
          <p className="text-sm text-[var(--text-soft)]">
            Nessun NPC disponibile. Creane uno nella sezione NPC.
          </p>
        ) : (
          npcs.map((npc) => (
            <label
              key={npc.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[var(--surface-muted)] px-3 py-3"
            >
              <span className="text-sm font-bold">
                {npc.name}{" "}
                <span className="font-normal text-[var(--text-soft)]">
                  ({npc.enemy ? "nemico" : "alleato"})
                </span>
              </span>
              <span className="flex items-center gap-2 text-sm">
                Quantità
                <input
                  type="number"
                  min={0}
                  max={20}
                  step={1}
                  disabled={isSaving}
                  className="w-20 rounded-lg border border-[var(--border-teal-soft)] bg-[var(--bg-app)] px-2 py-1 text-[var(--text-main)]"
                  value={quantities[npc.id] ?? 0}
                  onChange={(e) =>
                    setQuantities((prev) => ({
                      ...prev,
                      [npc.id]: Number(e.target.value),
                    }))
                  }
                />
              </span>
            </label>
          ))
        )}
      </fieldset>
      {(validation || error) && (
        <p role="alert" className="text-sm text-[var(--danger)]">
          {validation || error}
        </p>
      )}
      <div className="flex flex-wrap justify-end gap-3">
        <AppButton
          type="button"
          variant="secondary"
          disabled={isSaving}
          onClick={onCancel}
        >
          Annulla
        </AppButton>
        <AppButton type="submit" disabled={isSaving || npcs.length === 0}>
          {isSaving
            ? "Salvataggio..."
            : initial
              ? "Salva incontro"
              : "Crea incontro"}
        </AppButton>
      </div>
    </form>
  )
}
