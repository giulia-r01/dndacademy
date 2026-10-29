"use client"

import { useCallback, useEffect, useState } from "react"
import { FiHeart, FiShield, FiUsers } from "react-icons/fi"
import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import EntityPortrait from "@/components/common/EntityPortrait"
import CharacterCard from "@/components/characters/CharacterCard"
import { characterService } from "@/services/character.service"
import { combatService } from "@/services/combat.service"
import type { Character } from "@/types/character"
import type { CombatPreview, CombatPreviewNpc } from "@/types/combat"
import styles from "./CombatPreparation.module.css"

type Props = { campaignId: number; chapterId: number; isBusy: boolean; onStart: () => Promise<void> }
const abilityLabels = { strength: "Forza", dexterity: "Destrezza", constitution: "Costituzione", intelligence: "Intelligenza", wisdom: "Saggezza", charisma: "Carisma" } as const
const signed = (value: number) => `${value >= 0 ? "+" : ""}${value}`

function NpcPreview({ participant }: { participant: CombatPreviewNpc }) {
  const { npc, quantity } = participant
  return <article aria-label={`${npc.name}, quantità ${quantity}`} className="overflow-hidden rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)]">
    <div className="grid grid-cols-[110px_minmax(0,1fr)] sm:grid-cols-[140px_minmax(0,1fr)]">
      <EntityPortrait name={npc.name} imageUrl={npc.imageUrl} className="min-h-[220px] w-full rounded-none border-0" />
      <div className="min-w-0 space-y-3 p-3 sm:p-4">
        <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--accent-soft)]">{npc.enemy ? "Nemico" : "Aiutante"} · ×{quantity}</p><h4 className="mt-1 break-words text-lg font-black">{npc.name}</h4></div>
        <div className="flex flex-wrap gap-3 text-sm font-bold"><span className="flex items-center gap-1"><FiHeart aria-hidden="true" /> HP {npc.maxHp}</span><span className="flex items-center gap-1"><FiShield aria-hidden="true" /> CA {npc.armorClass}</span></div>
        <p className="text-sm text-[var(--text-soft)]">Attacco {signed(npc.attackModifier)} · Danno d{npc.damageDie}{signed(npc.damageModifier)}</p>
        <p className="text-xs text-[var(--text-muted)]">Iniziativa: d20 {signed(Math.floor((npc.dexterity - 10) / 2))}</p>
      </div>
    </div>
    {npc.description && <p className="border-t border-[var(--border-teal-soft)] p-3 text-sm leading-6 text-[var(--text-muted)]">{npc.description}</p>}
  </article>
}

export default function CombatPreparation({ campaignId, chapterId, isBusy, onStart }: Props) {
  const [character, setCharacter] = useState<Character | null>(null)
  const [available, setAvailable] = useState<Character[]>([])
  const [preview, setPreview] = useState<CombatPreview | null>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState("")
  const load = useCallback((active: () => boolean = () => true) => {
    return Promise.all([characterService.getMine(), combatService.getChapterPreview(chapterId)]).then(async ([mine, encounter]) => {
      if (encounter.campaignId !== campaignId) throw new Error("Questo incontro non appartiene alla campagna selezionata.")
      const selected = mine.find(item => item.campaignId === campaignId) ?? null
      const choices = selected ? [] : await characterService.getAvailableByCampaign(campaignId)
      return { selected, choices, encounter }
    }).then(({ selected, choices, encounter }) => {
      if (!active()) return
      setCharacter(selected)
      setAvailable(choices)
      setPreview(encounter)
      setError("")
    }).catch((err: unknown) => {
      if (active()) setError(err instanceof Error ? err.message : "Impossibile preparare lo scontro")
    }).finally(() => { if (active()) setLoading(false) })
  }, [campaignId, chapterId])

  useEffect(() => {
    let active = true
    void load(() => active)
    return () => { active = false }
  }, [load])

  async function claim(id: number) {
    if (claiming || isBusy) return
    setClaiming(true)
    setError("")
    try { setCharacter(await characterService.claim(id)) }
    catch (err) { setError(err instanceof Error ? err.message : "Personaggio non disponibile") }
    finally { setClaiming(false) }
  }

  if (loading) return <AppCard><p role="status">Preparazione dello scontro...</p></AppCard>
  const enemies = preview?.participants.filter(p => p.npc.enemy) ?? []
  const allies = preview?.participants.filter(p => !p.npc.enemy) ?? []
  const enemyCount = enemies.reduce((total, p) => total + p.quantity, 0)
  const ready = Boolean(character && character.currentHp > 0 && preview && !error)

  return <section aria-label="Preparazione dello scontro" className={`${styles.preparation} space-y-5`}>
    {error && <AppCard><div role="alert" className="space-y-3"><p className="text-[var(--danger)]">{error}</p><AppButton type="button" variant="secondary" disabled={claiming || isBusy} onClick={() => { setLoading(true); void load() }}>Riprova</AppButton></div></AppCard>}
    {preview && <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div><p className="text-xs font-bold uppercase tracking-widest text-[var(--accent-soft)]">Prima dello scontro · {preview.chapterTitle}</p><h3 className="mt-2 text-2xl font-black">{preview.title}</h3>{preview.description && <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--text-soft)]">{preview.description}</p>}</div>
        <p className="flex items-center gap-2 rounded-full bg-[var(--surface)] px-4 py-2 text-sm font-bold"><FiUsers aria-hidden="true" /> {enemyCount} {enemyCount === 1 ? "nemico" : "nemici"}</p>
      </div>
      <div className={styles.grid}>
        <section aria-label="Il tuo personaggio" className="min-w-0 space-y-3">
          <h3 className="text-lg font-black">Il tuo personaggio</h3>
          {character ? <>
            <CharacterCard character={character} campaignName={preview.campaignName} />
            {character.stats && <AppCard><h4 className="mb-3 text-sm font-bold">Caratteristiche</h4><dl className="grid grid-cols-3 gap-3 sm:grid-cols-6">{Object.entries(abilityLabels).map(([key, label]) => <div key={key} className="rounded-xl bg-[var(--surface-muted)] p-2 text-center"><dt className="text-xs text-[var(--text-muted)]">{label}</dt><dd className="mt-1 text-lg font-black">{character.stats![key as keyof typeof abilityLabels]}</dd></div>)}</dl></AppCard>}
            {character.currentHp <= 0 && <p role="alert" className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">Questo personaggio non può combattere con 0 HP. Recupera i punti vita prima di iniziare.</p>}
          </> : <AppCard><p className="font-bold">Scegli il personaggio con cui affrontare lo scontro.</p><p className="mt-2 text-sm text-[var(--text-soft)]">La scelta lo assegna a questa campagna.</p>{available.length === 0 && <p className="mt-4">Non ci sono personaggi disponibili per questa campagna.</p>}</AppCard>}
          {!character && available.map(item => <CharacterCard key={item.id} character={item} campaignName={preview.campaignName} mode="available" isClaiming={claiming || item.currentHp <= 0} onClaim={id => { void claim(id) }} />)}
        </section>
        <aside className="min-w-0 space-y-5" aria-label="Partecipanti allo scontro">
          <section aria-label="Nemici dell'incontro" className="space-y-3"><h3 className="text-lg font-black">Chi affronterai</h3>{enemies.map(p => <NpcPreview key={p.npc.id} participant={p} />)}</section>
          {allies.length > 0 && <section aria-label="Aiutanti dell'incontro" className="space-y-3"><h3 className="text-lg font-black">Al tuo fianco</h3>{allies.map(p => <NpcPreview key={p.npc.id} participant={p} />)}</section>}
        </aside>
      </div>
      <AppCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div><h3 className="font-black">{ready ? "Pronto a entrare in azione?" : "Prepara il tuo personaggio"}</h3><p className="mt-1 text-sm text-[var(--text-soft)]">All’inizio verrà tirata l’iniziativa per stabilire l’ordine dei turni.</p></div>
        <AppButton type="button" disabled={!ready || isBusy || claiming} onClick={onStart}>{isBusy ? "Avvio in corso..." : "Inizia il combattimento"}</AppButton>
      </AppCard>
    </>}
  </section>
}
