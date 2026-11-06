"use client"

import AppButton from "@/components/common/AppButton"
import AppModal from "@/components/common/AppModal"
import FormInput from "@/components/common/FormInput"
import CharacterImageField from "./CharacterImageField"
import type { AttackAbility } from "@/types/character"
import type { CharacterFormValues } from "@/types/characterForm"

type CharacterFormModalProps = {
  isOpen: boolean
  title: string
  description: string
  values: CharacterFormValues
  isSubmitting: boolean
  isUploadingImage: boolean
  imageUrl?: string | null
  onUploadImage?: (file: File) => Promise<void>
  submitLabel: string
  error?: string
  onClose: () => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
  onChange: <K extends keyof CharacterFormValues>(
    field: K,
    value: CharacterFormValues[K],
  ) => void
}

const attackAbilityOptions: { value: AttackAbility; label: string }[] = [
  { value: "STRENGTH", label: "Forza" },
  { value: "DEXTERITY", label: "Destrezza" },
  { value: "INTELLIGENCE", label: "Intelligenza" },
  { value: "WISDOM", label: "Saggezza" },
  { value: "CHARISMA", label: "Carisma" },
]

const damageDieOptions = [4, 6, 8, 10, 12]

export default function CharacterFormModal({
  isOpen,
  title,
  description,
  values,
  isSubmitting,
  isUploadingImage,
  imageUrl = null,
  onUploadImage,
  submitLabel,
  onClose,
  onSubmit,
  onChange,
  error,
}: CharacterFormModalProps) {
  return (
    <AppModal
      isOpen={isOpen}
      title={title}
      description={description}
      onClose={onClose}
      size="xl"
      disableClose={isSubmitting || isUploadingImage}
    >
      <form onSubmit={onSubmit} className="space-y-6">
        <fieldset
          disabled={isSubmitting || isUploadingImage}
          className="min-w-0 space-y-6"
        >
          <section className="space-y-4">
            <h3 className="text-lg font-black text-[var(--text-main)]">
              Identità
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="Nome"
                name="name"
                type="text"
                value={values.name}
                onChange={(event) => onChange("name", event.target.value)}
              />

              <FormInput
                label="Razza"
                name="race"
                type="text"
                value={values.race}
                onChange={(event) => onChange("race", event.target.value)}
              />

              <FormInput
                label="Classe"
                name="characterClass"
                type="text"
                value={values.characterClass}
                onChange={(event) =>
                  onChange("characterClass", event.target.value)
                }
              />

              <FormInput
                label="Livello"
                name="level"
                type="number"
                value={values.level}
                onChange={(event) =>
                  onChange("level", Number(event.target.value))
                }
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-black text-[var(--text-main)]">
              Difesa
            </h3>

            <div className="grid gap-4 md:grid-cols-2">
              <FormInput
                label="HP massimi"
                name="maxHp"
                type="number"
                value={values.maxHp}
                onChange={(event) =>
                  onChange("maxHp", Number(event.target.value))
                }
              />

              <FormInput
                label="Classe Armatura"
                name="armorClass"
                type="number"
                value={values.armorClass}
                onChange={(event) =>
                  onChange("armorClass", Number(event.target.value))
                }
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-black text-[var(--text-main)]">
              Statistiche
            </h3>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <FormInput
                label="Forza"
                name="strength"
                type="number"
                value={values.strength}
                onChange={(event) =>
                  onChange("strength", Number(event.target.value))
                }
              />

              <FormInput
                label="Destrezza"
                name="dexterity"
                type="number"
                value={values.dexterity}
                onChange={(event) =>
                  onChange("dexterity", Number(event.target.value))
                }
              />

              <FormInput
                label="Costituzione"
                name="constitution"
                type="number"
                value={values.constitution}
                onChange={(event) =>
                  onChange("constitution", Number(event.target.value))
                }
              />

              <FormInput
                label="Intelligenza"
                name="intelligence"
                type="number"
                value={values.intelligence}
                onChange={(event) =>
                  onChange("intelligence", Number(event.target.value))
                }
              />

              <FormInput
                label="Saggezza"
                name="wisdom"
                type="number"
                value={values.wisdom}
                onChange={(event) =>
                  onChange("wisdom", Number(event.target.value))
                }
              />

              <FormInput
                label="Carisma"
                name="charisma"
                type="number"
                value={values.charisma}
                onChange={(event) =>
                  onChange("charisma", Number(event.target.value))
                }
              />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-lg font-black text-[var(--text-main)]">
              Attacco con arma
            </h3>

            <div className="grid gap-4 md:grid-cols-3">
              <FormInput
                label="Nome arma"
                name="weaponName"
                type="text"
                value={values.weaponName}
                onChange={(event) => onChange("weaponName", event.target.value)}
              />

              <div>
                <label className="block text-sm font-bold text-[var(--text-main)]">
                  Dado danno
                </label>

                <select
                  value={values.damageDie}
                  onChange={(event) =>
                    onChange("damageDie", Number(event.target.value))
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)]"
                >
                  {damageDieOptions.map((die) => (
                    <option key={die} value={die}>
                      d{die}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-[var(--text-main)]">
                  Caratteristica
                </label>

                <select
                  value={values.attackAbility}
                  onChange={(event) =>
                    onChange(
                      "attackAbility",
                      event.target.value as AttackAbility,
                    )
                  }
                  className="mt-2 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)]"
                >
                  {attackAbilityOptions.map((ability) => (
                    <option key={ability.value} value={ability.value}>
                      {ability.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <label className="flex items-center gap-3 rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3">
              <input
                type="checkbox"
                checked={values.spellcaster}
                onChange={(event) =>
                  onChange("spellcaster", event.target.checked)
                }
              />

              <span className="font-bold text-[var(--text-main)]">
                Questo personaggio può lanciare incantesimi
              </span>
            </label>

            {values.spellcaster && (
              <div className="grid gap-4 md:grid-cols-3">
                <FormInput
                  label="Nome incantesimo"
                  name="spellName"
                  type="text"
                  value={values.spellName}
                  onChange={(event) =>
                    onChange("spellName", event.target.value)
                  }
                />

                <div>
                  <label className="block text-sm font-bold text-[var(--text-main)]">
                    Dado incantesimo
                  </label>

                  <select
                    value={values.spellDamageDie}
                    onChange={(event) =>
                      onChange("spellDamageDie", Number(event.target.value))
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)]"
                  >
                    {damageDieOptions.map((die) => (
                      <option key={die} value={die}>
                        d{die}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-bold text-[var(--text-main)]">
                    Caratteristica magica
                  </label>

                  <select
                    value={values.spellAbility}
                    onChange={(event) =>
                      onChange(
                        "spellAbility",
                        event.target.value as AttackAbility,
                      )
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)]"
                  >
                    {attackAbilityOptions.map((ability) => (
                      <option key={ability.value} value={ability.value}>
                        {ability.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </section>

          <CharacterImageField
            name={values.name}
            imageUrl={imageUrl}
            imageFile={values.imageFile}
            isBusy={isSubmitting || isUploadingImage}
            isUploading={isUploadingImage}
            onSelect={(file) => onChange("imageFile", file)}
            onUpload={onUploadImage}
          />

          {error && (
            <div className="sticky bottom-0 z-20 rounded-2xl border border-[var(--border-danger)] bg-[var(--surface)] px-4 py-3 shadow-[var(--shadow-glow)]">
              <p
                role="alert"
                className="text-sm font-bold text-[var(--text-danger)]"
              >
                {error}
              </p>
            </div>
          )}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <AppButton type="button" variant="secondary" onClick={onClose}>
              Annulla
            </AppButton>

            <AppButton type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvataggio..." : submitLabel}
            </AppButton>
          </div>
        </fieldset>
      </form>
    </AppModal>
  )
}
