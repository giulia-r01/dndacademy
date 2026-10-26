"use client"

import { useCallback, useEffect, useState } from "react"
import Image from "next/image"
import AppButton from "@/components/common/AppButton"
import { characterService } from "@/services/character.service"
import type { Character } from "@/types/character"

type Props = { campaignId: number; isBusy: boolean; onStart: () => Promise<void> }

export default function CombatPreparation({ campaignId, isBusy, onStart }: Props) {
  const [character, setCharacter] = useState<Character | null>(null)
  const [available, setAvailable] = useState<Character[]>([])
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState("")
  const load = useCallback((active: () => boolean = () => true) => {
    return characterService.getMine().then(async mine => {
      const selected = mine.find(item => item.campaignId === campaignId) ?? null
      const choices = selected ? [] : await characterService.getAvailableByCampaign(campaignId)
      return { selected, choices }
    }).then(({ selected, choices }) => {
      if (active()) {
        setCharacter(selected)
        setAvailable(choices)
        setError("")
      }
    }).catch((err: unknown) => {
      if (active()) setError(err instanceof Error ? err.message : "Impossibile verificare il personaggio")
    }).finally(() => { if (active()) setLoading(false) })
  }, [campaignId])

  useEffect(() => {
    let active = true
    void load(() => active)
    return () => { active = false }
  }, [load])

  async function claim(id: number) {
    if (claiming) return
    setClaiming(true)
    setError("")
    try { setCharacter(await characterService.claim(id)) }
    catch (err) { setError(err instanceof Error ? err.message : "Personaggio non disponibile") }
    finally { setClaiming(false) }
  }

  if (loading) return <p role="status">Verifica del personaggio...</p>
  return <div className="space-y-4">
    {error && <div role="alert" className="space-y-2 text-[var(--danger)]">
      <p>{error}</p>
      <AppButton type="button" variant="secondary" disabled={claiming || isBusy} onClick={() => { setLoading(true); void load() }}>Verifica di nuovo</AppButton>
    </div>}
    {character ? <>
      <div className="flex items-center gap-3">
        {character.imageUrl && <Image unoptimized src={character.imageUrl} alt={character.name} width={64} height={64} className="h-16 w-16 rounded-xl object-cover" />}
        <div><p className="font-bold">Il tuo personaggio: {character.name}</p><p>HP {character.currentHp}/{character.maxHp}</p></div>
      </div>
      {character.currentHp <= 0 ? <p role="alert">Il personaggio è sconfitto. Chiedi al Master di curarlo prima di iniziare.</p> :
        <AppButton type="button" disabled={isBusy || !!error} onClick={onStart}>{isBusy ? "Avvio in corso..." : "Inizia il combattimento"}</AppButton>}
    </> : !error && <>
      <p className="font-bold">Prima di combattere, scegli il tuo personaggio per questa campagna.</p>
      {available.length === 0 ? <p>Non ci sono personaggi disponibili. Chiedi al Master di prepararne uno.</p> :
        <div className="grid gap-3 sm:grid-cols-2">{available.map(item => <div key={item.id} className="space-y-3 rounded-xl bg-[var(--surface-muted)] p-4">
          {item.imageUrl && <Image unoptimized src={item.imageUrl} alt={item.name} width={80} height={80} className="h-20 w-20 rounded-xl object-cover" />}
          <p className="font-bold">{item.name} · {item.characterClass}</p>
          <p>HP {item.currentHp}/{item.maxHp}</p>
          <AppButton type="button" disabled={claiming || item.currentHp <= 0} onClick={() => claim(item.id)}>{claiming ? "Selezione..." : `Scegli ${item.name}`}</AppButton>
        </div>)}</div>}
    </>}
  </div>
}
