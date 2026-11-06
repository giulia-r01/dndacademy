"use client"

import { useState, type ReactNode } from "react"
import { FiCheckCircle, FiFlag } from "react-icons/fi"
import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import RichTextEditor from "@/components/common/RichTextEditor"
import FormInput from "@/components/common/FormInput"
import { learningLevelLabels } from "@/lib/learning-level"
import type { LearningLevel } from "@/types/user"
import type { DemoScreenProps } from "./types"

const inputClass =
  "mt-2 block w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-3 py-3 text-[var(--text-main)]"

function NumberField({
  label,
  value,
  onChange,
  min = 1,
  max = 100,
}: {
  label: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
}) {
  return (
    <label className="block text-sm font-bold">
      {label}
      <input
        type="number"
        required
        min={min}
        max={max}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className={inputClass}
      />
    </label>
  )
}

function DemoForm({
  title,
  children,
  onSave,
  saved,
}: {
  title: string
  children: ReactNode
  onSave: () => void
  saved: boolean
}) {
  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        onSave()
      }}
      className="space-y-4"
    >
      <h3 className="text-2xl font-black">{title}</h3>
      <AppCard className="space-y-4">
        {children}
        <div className="flex flex-wrap items-center gap-3">
          <AppButton type="submit">Salva esempio</AppButton>
          {saved && (
            <span className="flex items-center gap-2 text-sm text-[var(--primary)]">
              <FiCheckCircle aria-hidden="true" />
              Salvato nel tour
            </span>
          )}
        </div>
      </AppCard>
    </form>
  )
}

export default function MasterDemo({
  screen,
  stepId,
  demo,
  setDemo,
  notify,
  navigate,
  act,
}: DemoScreenProps) {
  const [pendingUser, setPendingUser] = useState<number | null>(null)
  const save = (message: string, valid = true) => {
    notify(
      valid
        ? message
        : "Completa i campi obbligatori prima di salvare l’esempio.",
      !valid,
    )
    return valid
  }
  if (screen === "master-home")
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-black">Prepara un’avventura</h3>
        <AppCard className="space-y-4 border-[var(--border-gold)]">
          <FiFlag
            size={28}
            aria-hidden="true"
            className="text-[var(--accent)]"
          />
          <ol className="space-y-3 text-[var(--text-soft)]">
            <li>1. Campagna e personaggi</li>
            <li>2. Lezioni, quiz, PNG e badge</li>
            <li>3. Capitoli e incontri</li>
          </ol>
          <AppButton
            data-tour-action="manage-campaigns"
            onClick={() => navigate("campaigns")}
          >
            Gestisci campagne
          </AppButton>
        </AppCard>
        <p className="text-sm text-[var(--text-muted)]">
          Nell’app reale il menu raggruppa Gestione, Didattica, Risorse e
          Amministrazione.
        </p>
      </div>
    )

  if (screen === "campaigns")
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-black">Gestione campagne</h2>
        <AppCard className="space-y-3">
          <p>Prepara una nuova avventura per i tuoi giocatori.</p>
          <AppButton
            data-tour-action="new-campaign"
            onClick={() => navigate("campaign-form")}
          >
            Nuova campagna
          </AppButton>
        </AppCard>
      </div>
    )

  if (screen === "campaign-form")
    return (
      <DemoForm
        title="Nuova campagna"
        saved={demo.campaign.saved}
        onSave={() => {
          if (
            save(
              "Campagna salvata solo nel tour. Il titolo si aggiornerà nelle prossime anteprime.",
              !!demo.campaign.name.trim() && !!demo.campaign.description.trim(),
            )
          )
            setDemo((current) => ({
              ...current,
              campaign: { ...current.campaign, saved: true },
            }))
        }}
      >
        <FormInput
          label="Nome campagna"
          name="tour-campaign-name"
          value={demo.campaign.name}
          required
          maxLength={255}
          onChange={(event) =>
            setDemo((current) => ({
              ...current,
              campaign: {
                ...current.campaign,
                name: event.target.value,
                saved: false,
              },
            }))
          }
        />
        <RichTextEditor
          label="Descrizione"
          value={demo.campaign.description}
          onChange={(value) =>
            setDemo((current) => ({
              ...current,
              campaign: {
                ...current.campaign,
                description: value,
                saved: false,
              },
            }))
          }
          maxLength={2000}
          rows={3}
        />
        <label className="block text-sm font-bold">
          Difficoltà
          <select
            className={inputClass}
            value={demo.campaign.difficulty}
            onChange={(event) =>
              setDemo((current) => ({
                ...current,
                campaign: {
                  ...current.campaign,
                  difficulty: event.target.value as LearningLevel,
                  saved: false,
                },
              }))
            }
          >
            {Object.entries(learningLevelLabels).map(([value, text]) => (
              <option key={value} value={value}>
                {text}
              </option>
            ))}
          </select>
        </label>
      </DemoForm>
    )

  if (screen === "character-form")
    return (
      <DemoForm
        title="Personaggio della campagna"
        saved={demo.characterSaved}
        onSave={() => {
          if (
            save(
              "Personaggio dimostrativo salvato nella campagna.",
              !!demo.character.name.trim() &&
                !!demo.character.race.trim() &&
                !!demo.character.characterClass.trim(),
            )
          )
            setDemo((current) => ({ ...current, characterSaved: true }))
        }}
      >
        <p className="text-sm text-[var(--accent-soft)]">
          Campagna: {demo.campaign.name}
        </p>
        <FormInput
          label="Nome personaggio"
          name="tour-character-name"
          required
          value={demo.character.name}
          onChange={(event) =>
            setDemo((current) => ({
              ...current,
              character: { ...current.character, name: event.target.value },
              characterSaved: false,
            }))
          }
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <FormInput
            label="Razza"
            name="tour-character-race"
            required
            value={demo.character.race}
            onChange={(event) =>
              setDemo((current) => ({
                ...current,
                character: { ...current.character, race: event.target.value },
                characterSaved: false,
              }))
            }
          />
          <FormInput
            label="Classe"
            name="tour-character-class"
            required
            value={demo.character.characterClass}
            onChange={(event) =>
              setDemo((current) => ({
                ...current,
                character: {
                  ...current.character,
                  characterClass: event.target.value,
                },
                characterSaved: false,
              }))
            }
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <NumberField
            label="Livello personaggio"
            max={20}
            value={demo.character.level}
            onChange={(level) =>
              setDemo((current) => ({
                ...current,
                character: { ...current.character, level },
                characterSaved: false,
              }))
            }
          />
          <NumberField
            label="Punti vita massimi"
            max={200}
            value={demo.character.maxHp}
            onChange={(maxHp) =>
              setDemo((current) => ({
                ...current,
                character: { ...current.character, maxHp, currentHp: maxHp },
                characterSaved: false,
              }))
            }
          />
          <NumberField
            label="Classe Armatura"
            max={30}
            value={demo.character.armorClass}
            onChange={(armorClass) =>
              setDemo((current) => ({
                ...current,
                character: { ...current.character, armorClass },
                characterSaved: false,
              }))
            }
          />
        </div>
        <p className="text-sm text-[var(--text-muted)]">
          Arma preconfigurata: {demo.character.weaponName} · d
          {demo.character.damageDie} · Forza. Caratteristiche di esempio: Forza
          16, Destrezza 12, Costituzione 14, Intelligenza 10, Saggezza 12,
          Carisma 10.
        </p>
      </DemoForm>
    )

  if (screen === "lesson-form")
    return (
      <DemoForm
        title="Prepara la lezione"
        saved={demo.lesson.saved}
        onSave={() => {
          if (
            save(
              "Lezione dimostrativa salvata. Ora puoi associarle il quiz.",
              !!demo.lesson.title.trim() && !!demo.lesson.content.trim(),
            )
          )
            setDemo((current) => ({
              ...current,
              lesson: { ...current.lesson, saved: true },
            }))
        }}
      >
        <FormInput
          label="Titolo lezione"
          name="tour-lesson-title"
          required
          value={demo.lesson.title}
          onChange={(event) =>
            setDemo((current) => ({
              ...current,
              lesson: {
                ...current.lesson,
                title: event.target.value,
                saved: false,
              },
            }))
          }
        />
        <RichTextEditor
          label="Contenuto"
          value={demo.lesson.content}
          onChange={(value) =>
            setDemo((current) => ({
              ...current,
              lesson: { ...current.lesson, content: value, saved: false },
            }))
          }
          maxLength={5000}
          rows={6}
        />
        <NumberField
          label="Ordine lezione"
          value={demo.lesson.order}
          onChange={(order) =>
            setDemo((current) => ({
              ...current,
              lesson: { ...current.lesson, order, saved: false },
            }))
          }
        />
        <p className="text-sm text-[var(--text-muted)]">
          Questa lezione di esempio è disponibile inizialmente.
        </p>
      </DemoForm>
    )

  if (screen === "quiz-form")
    return (
      <DemoForm
        title="Quiz, domanda e risposte"
        saved={demo.quiz.saved}
        onSave={() => {
          if (
            save(
              "Quiz di esempio salvato con la sua domanda e la risposta corretta.",
              !!demo.quiz.title.trim() && !!demo.quiz.question.trim(),
            )
          )
            setDemo((current) => ({
              ...current,
              quiz: { ...current.quiz, saved: true },
            }))
        }}
      >
        <p className="text-sm text-[var(--accent-soft)]">
          Lezione associata: {demo.lesson.title}
        </p>
        <FormInput
          label="Titolo quiz"
          name="tour-quiz-title"
          required
          value={demo.quiz.title}
          onChange={(event) =>
            setDemo((current) => ({
              ...current,
              quiz: {
                ...current.quiz,
                title: event.target.value,
                saved: false,
              },
            }))
          }
        />
        <NumberField
          label="Punteggio minimo (%)"
          min={1}
          value={demo.quiz.passingScore}
          onChange={(passingScore) =>
            setDemo((current) => ({
              ...current,
              quiz: { ...current.quiz, passingScore, saved: false },
            }))
          }
        />
        <FormInput
          label="Domanda di esempio"
          name="tour-question"
          required
          value={demo.quiz.question}
          onChange={(event) =>
            setDemo((current) => ({
              ...current,
              quiz: {
                ...current.quiz,
                question: event.target.value,
                saved: false,
              },
            }))
          }
        />
        <fieldset className="space-y-3">
          <legend className="mb-2 font-bold">
            Indica la risposta corretta
          </legend>
          {(["d20", "d4"] as const).map((answer) => (
            <label
              key={answer}
              className="flex items-center gap-3 rounded-xl bg-[var(--surface-muted)] p-3"
            >
              <input
                type="radio"
                name="tour-correct-answer"
                checked={demo.quiz.correctAnswer === answer}
                onChange={() =>
                  setDemo((current) => ({
                    ...current,
                    quiz: {
                      ...current.quiz,
                      correctAnswer: answer,
                      saved: false,
                    },
                  }))
                }
              />
              {answer}
            </label>
          ))}
        </fieldset>
      </DemoForm>
    )

  if (screen === "npc-form")
    return (
      <DemoForm
        title="PNG della tua libreria"
        saved={demo.npc.saved}
        onSave={() => {
          if (
            save(
              "PNG dimostrativo salvato nella libreria del tour.",
              !!demo.npc.name.trim(),
            )
          )
            setDemo((current) => ({
              ...current,
              npc: { ...current.npc, saved: true },
            }))
        }}
      >
        <FormInput
          label="Nome PNG"
          name="tour-npc-name"
          required
          value={demo.npc.name}
          onChange={(event) =>
            setDemo((current) => ({
              ...current,
              npc: { ...current.npc, name: event.target.value, saved: false },
            }))
          }
        />
        <label className="block text-sm font-bold">
          Schieramento
          <select
            className={inputClass}
            value={demo.npc.enemy ? "enemy" : "ally"}
            onChange={(event) =>
              setDemo((current) => ({
                ...current,
                npc: {
                  ...current.npc,
                  enemy: event.target.value === "enemy",
                  healer: false,
                  saved: false,
                },
              }))
            }
          >
            <option value="enemy">Nemico</option>
            <option value="ally">Aiutante</option>
          </select>
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <NumberField
            label="HP PNG"
            max={200}
            value={demo.npc.maxHp}
            onChange={(maxHp) =>
              setDemo((current) => ({
                ...current,
                npc: { ...current.npc, maxHp, saved: false },
              }))
            }
          />
          <NumberField
            label="CA PNG"
            max={30}
            value={demo.npc.armorClass}
            onChange={(armorClass) =>
              setDemo((current) => ({
                ...current,
                npc: { ...current.npc, armorClass, saved: false },
              }))
            }
          />
        </div>
        {!demo.npc.enemy && (
          <label className="flex items-center gap-3">
            <input
              type="checkbox"
              checked={demo.npc.healer}
              onChange={(event) =>
                setDemo((current) => ({
                  ...current,
                  npc: {
                    ...current.npc,
                    healer: event.target.checked,
                    saved: false,
                  },
                }))
              }
            />
            Guaritore
          </label>
        )}
        <p className="text-sm text-[var(--text-muted)]">
          Attacco preconfigurato: +3 · danno d6 +1 · Destrezza 12.
          {demo.npc.healer && " Cure: d6 +2, 3 utilizzi per combattimento."}
        </p>
      </DemoForm>
    )

  if (screen === "badge-form")
    return (
      <DemoForm
        title="Una ricompensa per il capitolo"
        saved={demo.badge.saved}
        onSave={() => {
          if (
            save(
              "Badge dimostrativo salvato. Puoi associarlo al capitolo.",
              !!demo.badge.name.trim() && !!demo.badge.description.trim(),
            )
          )
            setDemo((current) => ({
              ...current,
              badge: { ...current.badge, saved: true },
            }))
        }}
      >
        <FormInput
          label="Nome badge"
          name="tour-badge-name"
          required
          maxLength={255}
          value={demo.badge.name}
          onChange={(event) =>
            setDemo((current) => ({
              ...current,
              badge: {
                ...current.badge,
                name: event.target.value,
                saved: false,
              },
            }))
          }
        />
        <FormInput
          label="Descrizione badge"
          name="tour-badge-description"
          required
          maxLength={1000}
          value={demo.badge.description}
          onChange={(event) =>
            setDemo((current) => ({
              ...current,
              badge: {
                ...current.badge,
                description: event.target.value,
                saved: false,
              },
            }))
          }
        />
        <p className="text-sm text-[var(--text-muted)]">
          Il catalogo include anche i badge di sistema: Primo Quiz, Studente di
          D&D e Avventuriero Esperto.
        </p>
      </DemoForm>
    )

  if (screen === "chapter-form")
    return (
      <DemoForm
        title="Configura il capitolo"
        saved={demo.chapter.saved}
        onSave={() => {
          if (
            !demo.chapter.lesson ||
            !demo.chapter.quiz ||
            !demo.chapter.combat ||
            !demo.chapter.badge
          ) {
            notify(
              "Per questa avventura di prova mantieni selezionati lezione, quiz, combattimento e badge, poi salva il capitolo.",
              true,
            )
            return
          }
          if (
            save(
              "Capitolo dimostrativo salvato con le attività selezionate.",
              !!demo.chapter.title.trim() && !!demo.chapter.story.trim(),
            )
          )
            setDemo((current) => ({
              ...current,
              chapter: { ...current.chapter, saved: true },
            }))
        }}
      >
        <p className="text-sm text-[var(--accent-soft)]">
          Campagna: {demo.campaign.name}
        </p>
        <FormInput
          label="Titolo capitolo"
          name="tour-chapter-title"
          required
          value={demo.chapter.title}
          onChange={(event) =>
            setDemo((current) => ({
              ...current,
              chapter: {
                ...current.chapter,
                title: event.target.value,
                saved: false,
              },
            }))
          }
        />
        <NumberField
          label="Ordine capitolo"
          value={demo.chapter.order}
          onChange={(order) =>
            setDemo((current) => ({
              ...current,
              chapter: { ...current.chapter, order, saved: false },
            }))
          }
        />
        <RichTextEditor
          label="Storia"
          value={demo.chapter.story}
          onChange={(value) =>
            setDemo((current) => ({
              ...current,
              chapter: { ...current.chapter, story: value, saved: false },
            }))
          }
          maxLength={8000}
          rows={4}
        />
        <fieldset className="space-y-3">
          <legend className="mb-2 font-bold">Attività e ricompensa</legend>
          {(["lesson", "quiz", "combat", "badge"] as const).map((field) => (
            <label key={field} className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={demo.chapter[field]}
                disabled={field === "quiz" && !demo.chapter.lesson}
                onChange={(event) => {
                  const checked = event.target.checked
                  setDemo((current) => ({
                    ...current,
                    chapter: {
                      ...current.chapter,
                      [field]: checked,
                      ...(field === "lesson" && !checked
                        ? { quiz: false }
                        : {}),
                      saved: false,
                    },
                  }))
                }}
              />
              {
                {
                  lesson: `Lezione: ${demo.lesson.title}`,
                  quiz: `Quiz: ${demo.quiz.title}`,
                  combat: "Prevede un combattimento",
                  badge: `Badge: ${demo.badge.name}`,
                }[field]
              }
            </label>
          ))}
        </fieldset>
      </DemoForm>
    )

  if (screen === "encounter-form")
    return (
      <DemoForm
        title="Incontro del capitolo"
        saved={demo.encounter.saved}
        onSave={() => {
          if (
            save(
              "Incontro dimostrativo salvato: nemici e aiutanti sono pronti.",
              !!demo.encounter.title.trim() && demo.encounter.enemies >= 1,
            )
          )
            setDemo((current) => ({
              ...current,
              encounter: { ...current.encounter, saved: true },
            }))
        }}
      >
        <p className="text-sm text-[var(--accent-soft)]">
          {demo.campaign.name} → {demo.chapter.title}
        </p>
        <FormInput
          label="Titolo incontro"
          name="tour-encounter-title"
          required
          value={demo.encounter.title}
          onChange={(event) =>
            setDemo((current) => ({
              ...current,
              encounter: {
                ...current.encounter,
                title: event.target.value,
                saved: false,
              },
            }))
          }
        />
        <NumberField
          label={`Quantità nemici: ${demo.npc.enemy ? demo.npc.name : "Goblin delle miniere"}`}
          value={demo.encounter.enemies}
          max={20}
          onChange={(enemies) =>
            setDemo((current) => ({
              ...current,
              encounter: { ...current.encounter, enemies, saved: false },
            }))
          }
        />
        <NumberField
          label={`Quantità aiutanti: ${demo.npc.enemy ? "Selene, guida guaritrice" : demo.npc.name}`}
          value={demo.encounter.allies}
          min={0}
          max={20}
          onChange={(allies) =>
            setDemo((current) => ({
              ...current,
              encounter: { ...current.encounter, allies, saved: false },
            }))
          }
        />
        <p className="text-sm text-[var(--text-muted)]">
          Almeno un nemico è necessario. Gli aiutanti sono facoltativi e possono
          offrire cure durante lo scontro.
        </p>
      </DemoForm>
    )

  if (screen === "users") {
    const selected =
      stepId === "confirm-role"
        ? demo.users.find((user) => user.username === "arianna_demo")
        : demo.users.find((user) => user.id === pendingUser)
    return (
      <div className="space-y-4">
        <h3 className="text-2xl font-black">Utenti e statistiche</h3>
        <p className="text-sm text-[var(--text-soft)]">
          {demo.users.length} utenti dimostrativi ·{" "}
          {demo.users.filter((user) => user.role === "MASTER").length} Master
        </p>
        {demo.users.map((user) => (
          <AppCard key={user.id} className="space-y-3">
            <h4 className="break-words font-black">
              {user.username}
              {user.self && " (tu)"}
            </h4>
            <p className="text-sm text-[var(--text-soft)]">
              {user.role === "MASTER" ? "Master" : "Player"} ·{" "}
              {learningLevelLabels[user.learningLevel]}
            </p>
            {user.self ? (
              <p className="text-sm text-[var(--text-muted)]">
                Non puoi modificare il tuo ruolo.
              </p>
            ) : (
              <AppButton
                data-tour-action={
                  user.username === "arianna_demo" ? "promote-user" : undefined
                }
                variant="secondary"
                onClick={() => {
                  setPendingUser(user.id)
                  act("request-role")
                }}
              >
                {user.role === "PLAYER" ? "Rendi Master" : "Riporta a Player"}
                <span className="sr-only">: {user.username}</span>
              </AppButton>
            )}
          </AppCard>
        ))}
        {selected && (
          <AppCard
            data-tour-action="confirm-role"
            role="group"
            aria-label="Conferma cambio ruolo dimostrativo"
            className="space-y-3 border-[var(--border-gold)]"
          >
            <p>
              Confermi il cambio di ruolo per{" "}
              <strong>{selected.username}</strong>?
            </p>
            <div className="flex flex-wrap gap-3">
              <AppButton
                onClick={() => {
                  setDemo((current) => ({
                    ...current,
                    users: current.users.map((user) =>
                      user.id === selected.id && !user.self
                        ? {
                            ...user,
                            role: user.role === "PLAYER" ? "MASTER" : "PLAYER",
                          }
                        : user,
                    ),
                  }))
                  setPendingUser(null)
                  notify(
                    "Ruolo cambiato soltanto nell’esempio. Nessun account reale è stato modificato.",
                  )
                }}
              >
                Conferma cambio di esempio
              </AppButton>
            </div>
          </AppCard>
        )}
      </div>
    )
  }
  return null
}
