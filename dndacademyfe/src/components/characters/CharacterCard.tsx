import EntityPortrait from "@/components/common/EntityPortrait"
import CharacterInfo from "@/components/characters/CharacterInfo"
import CharacterAbilities from "@/components/characters/CharacterAbilities"

import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import type { Character } from "@/types/character"

type CharacterCardMode = "owned" | "available"

type CharacterCardProps = {
  character: Character
  campaignName?: string
  mode?: CharacterCardMode
  claimDisabledReason?: string
  isClaiming?: boolean
  onClaim?: (characterId: number) => void
}

const abilityLabels = {
  STRENGTH: "Forza",
  DEXTERITY: "Destrezza",
  INTELLIGENCE: "Intelligenza",
  WISDOM: "Saggezza",
  CHARISMA: "Carisma",
}

export default function CharacterCard({
  character,
  campaignName,
  mode = "owned",
  isClaiming = false,
  claimDisabledReason,
  onClaim,
}: CharacterCardProps) {
  const hpPercentage =
    character.maxHp > 0
      ? Math.round((character.currentHp / character.maxHp) * 100)
      : 0

  const isAvailable = character.playerUsername === null
  const canClaim = mode === "available" && isAvailable && onClaim

  return (
    <AppCard role="article" aria-label={`Scheda di ${character.name}`} className="transition hover:-translate-y-0.5 hover:border-[var(--border-gold)]">
      <div className="flex flex-col gap-5 md:flex-row md:items-start">
        <EntityPortrait name={character.name} imageUrl={character.imageUrl} />

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
                {claimDisabledReason ? "Solo consultazione" : "Disponibile"}
              </span>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
              <CharacterInfo label="HP · Punti vita" explanation="Indicano quanto il personaggio può resistere ai danni. Il primo numero è il valore attuale, il secondo il massimo. Non sono una misura della capacità di evitare un colpo: quella dipende dalla Classe Armatura." />

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
              <CharacterInfo label="Classe Armatura" explanation="La CA è il numero che un tiro per colpire deve raggiungere o superare per colpire il personaggio. Una CA maggiore rende più difficile essere colpiti; non viene sottratta ai danni ricevuti." />

              <p className="mt-2 text-lg font-black text-[var(--text-main)]">
                {character.armorClass}
              </p>
            </div>
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            <div className="rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3">
              <CharacterInfo label="Arma" explanation="Il dado indica il danno base dell’arma: d6 significa un dado a sei facce, non sei danni fissi. La caratteristica indicata è quella configurata per questo attacco. Il tiro per colpire e il tiro dei danni sono due tiri distinti." />

              <p className="mt-2 font-bold text-[var(--text-main)]">
                {character.weaponName}
              </p>

              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Danno d{character.damageDie} ·{" "}
                {abilityLabels[character.attackAbility] ?? "Caratteristica non disponibile"}
              </p>
            </div>

            {character.spellcaster && (
              <div className="rounded-xl border border-[var(--border-gold)]/40 bg-[rgba(245,158,11,0.12)] px-4 py-3">
                <CharacterInfo label="Incantesimo" explanation="Questo è l’attacco magico disponibile nella scheda. Sono indicati il suo nome, il dado del danno base e la caratteristica usata per lanciarlo. Il dado del danno non è il tiro per colpire e questa voce non rappresenta tutti gli incantesimi di una scheda completa di D&D." />

                <p className="mt-2 font-bold text-[var(--text-main)]">
                  {character.spellName}
                </p>

                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Danno d{character.spellDamageDie} ·{" "}
                  {character.spellAbility
                    ? abilityLabels[character.spellAbility]
                    : "Caratteristica non configurata"}
                </p>
              </div>
            )}
            {!character.spellcaster && <div className="rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3"><CharacterInfo label="Incantesimi" explanation="Questa scheda non dispone di un attacco con incantesimo configurato. Puoi confrontare arma, difesa e caratteristiche per capire come il personaggio può contribuire all’avventura." /><p className="mt-2 text-sm text-[var(--text-muted)]">Nessun attacco con incantesimo disponibile.</p></div>}
          </div>

        </div>
      </div>

      <CharacterAbilities stats={character.stats} />

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs font-bold text-[var(--text-muted)]">
          Campagna: {campaignName ?? `#${character.campaignId}`}
        </p>

        {canClaim && (
          <AppButton
            type="button"
            disabled={isClaiming || !!claimDisabledReason}
            onClick={() => onClaim(character.id)}
          >
            {isClaiming ? "Scelta in corso..." : claimDisabledReason ? "Scelta non disponibile" : "Scegli personaggio"}
          </AppButton>
        )}
      </div>
    </AppCard>
  )
}
