"use client"

import { FiEdit3, FiTrash2 } from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import CharacterCard from "@/components/characters/CharacterCard"
import type { Character } from "@/types/character"

type AdminCharacterCardProps = {
  character: Character
  campaignName?: string
  onEdit: (character: Character) => void
  onDelete: (character: Character) => void
}

export default function AdminCharacterCard({
  character,
  campaignName,
  onEdit,
  onDelete,
}: AdminCharacterCardProps) {
  const isAlreadyChosen = character.playerUsername !== null

  return (
    <div className="space-y-3">
      <CharacterCard character={character} campaignName={campaignName} />

      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface)] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-[var(--text-main)]">
            Azioni Master
          </p>

          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {isAlreadyChosen
              ? `Scelto da ${character.playerUsername}. Può essere modificato, ma non eliminato.`
              : "Personaggio disponibile. Può essere modificato o eliminato."}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => onEdit(character)}
          >
            <span className="inline-flex items-center gap-2">
              <FiEdit3 aria-hidden="true" />
              Modifica
            </span>
          </AppButton>

          <AppButton
            type="button"
            variant="danger"
            disabled={isAlreadyChosen}
            onClick={() => onDelete(character)}
          >
            <span className="inline-flex items-center gap-2">
              <FiTrash2 aria-hidden="true" />
              Elimina
            </span>
          </AppButton>
        </div>
      </div>
    </div>
  )
}
