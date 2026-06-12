import { FiHeart, FiShield, FiUser } from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import type { Character } from "@/types/character"

type CharacterCardMode = "owned" | "available"

type CharacterCardProps = {
  character: Character
  mode?: CharacterCardMode
  isClaiming?: boolean
  onClaim?: (characterId: number) => void
}

export default function CharacterCard({
  character,
  mode = "owned",
  isClaiming = false,
  onClaim,
}: CharacterCardProps) {
  const hpPercentage =
    character.maxHp > 0
      ? Math.round((character.currentHp / character.maxHp) * 100)
      : 0

  const isAvailable = character.playerUsername === null
  const canClaim = mode === "available" && isAvailable && onClaim

  return (
    <AppCard className="transition hover:-translate-y-0.5 hover:border-[var(--border-gold)]">
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface-muted)] text-[var(--accent)]">
          <FiUser size={28} aria-hidden="true" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-xl font-black text-[var(--text-main)]">
                {character.name}
              </h3>

              <p className="mt-1 text-sm font-bold text-[var(--accent-soft)]">
                {character.race} · {character.characterClass} · Livello{" "}
                {character.level}
              </p>
            </div>

            {mode === "available" && (
              <span className="w-fit rounded-xl border border-[var(--border-gold)]/40 bg-[rgba(245,158,11,0.12)] px-3 py-1 text-xs font-bold text-[var(--accent-soft)]">
                Disponibile
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
              <div className="flex items-center gap-2 text-[var(--text-soft)]">
                <FiHeart aria-hidden="true" />
                <span className="text-sm font-bold">HP</span>
              </div>

              <p className="mt-2 text-lg font-black text-[var(--text-main)]">
                {character.currentHp} / {character.maxHp}
              </p>

              <div
                className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--bg-app-deep)]"
                role="progressbar"
                aria-label={`Punti vita ${character.currentHp} su ${character.maxHp}`}
                aria-valuenow={character.currentHp}
                aria-valuemin={0}
                aria-valuemax={character.maxHp}
              >
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]"
                  style={{ width: `${hpPercentage}%` }}
                />
              </div>
            </div>

            <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
              <div className="flex items-center gap-2 text-[var(--text-soft)]">
                <FiShield aria-hidden="true" />
                <span className="text-sm font-bold">Classe Armatura</span>
              </div>

              <p className="mt-2 text-lg font-black text-[var(--text-main)]">
                {character.armorClass}
              </p>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs font-bold text-[var(--text-muted)]">
              Campagna ID: {character.campaignId}
            </p>

            {canClaim && (
              <AppButton
                type="button"
                disabled={isClaiming}
                onClick={() => onClaim(character.id)}
              >
                {isClaiming ? "Scelta in corso..." : "Scegli personaggio"}
              </AppButton>
            )}
          </div>
        </div>
      </div>
    </AppCard>
  )
}
