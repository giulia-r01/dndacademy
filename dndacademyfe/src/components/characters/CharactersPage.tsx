"use client"

import { useEffect, useRef, useState } from "react"

import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import CharacterCard from "@/components/characters/CharacterCard"
import { campaignService } from "@/services/campaign.service"
import { characterService } from "@/services/character.service"
import type { Campaign } from "@/types/campaign"
import type { Character } from "@/types/character"

export default function CharactersPage({ initialCampaignId }: { initialCampaignId: number | null }) {
  const [myCharacters, setMyCharacters] = useState<Character[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>(
    [],
  )

  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    initialCampaignId,
  )

  const [claimingCharacterId, setClaimingCharacterId] = useState<number | null>(
    null,
  )

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const availableRequest = useRef(0)

  function getCampaignName(campaignId: number) {
    return campaigns.find((campaign) => campaign.id === campaignId)?.name
  }

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [charactersData, allCampaigns, progress] = await Promise.all([
          characterService.getMine(),
          campaignService.getAll(),
          campaignService.getMyProgress(),
        ])

        const joined = new Set(progress.filter(item => item.joined && item.unlocked).map(item => item.campaignId))
        const campaignsData = allCampaigns.filter(item => joined.has(item.id))
        setMyCharacters(charactersData)
        setCampaigns(campaignsData)

        const requested = initialCampaignId ? campaignsData.find(item => item.id === initialCampaignId) : null
        if (initialCampaignId && !requested) throw new Error("Per scegliere un personaggio devi prima unirti a questa campagna e sbloccarla.")
        if (requested || campaignsData.length === 1) {
          const onlyCampaign = requested ?? campaignsData[0]

          setSelectedCampaignId(onlyCampaign.id)

          const availableData = await characterService.getAvailableByCampaign(
            onlyCampaign.id,
          )

          setAvailableCharacters(availableData)
        }
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Errore nel caricamento personaggi"

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadInitialData()
  }, [initialCampaignId])

  async function handleCampaignChange(campaignId: number) {
    const request = ++availableRequest.current
    setSelectedCampaignId(campaignId)
    setAvailableCharacters([])
    setError("")
    setSuccessMessage("")
    setIsLoadingAvailable(true)

    try {
      const data = await characterService.getAvailableByCampaign(campaignId)
      if (request === availableRequest.current) setAvailableCharacters(data)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Errore nel caricamento personaggi disponibili"

      if (request === availableRequest.current) setError(message)
    } finally {
      if (request === availableRequest.current) setIsLoadingAvailable(false)
    }
  }

  const selectedCharacter = myCharacters.find(character => character.campaignId === selectedCampaignId)

  async function handleClaim(characterId: number) {
    const character = availableCharacters.find(item => item.id === characterId)
    if (!character || claimingCharacterId !== null || myCharacters.some(item => item.campaignId === character.campaignId)) return
    setError("")
    setSuccessMessage("")
    setClaimingCharacterId(characterId)

    try {
      const claimedCharacter = await characterService.claim(characterId)

      setMyCharacters((current) => [...current, claimedCharacter])

      setAvailableCharacters((current) =>
        current.filter((character) => character.id !== characterId),
      )

      setSuccessMessage("Personaggio scelto correttamente.")
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Errore durante la scelta del personaggio"

      setError(message)
    } finally {
      setClaimingCharacterId(null)
    }
  }

  return (
    <AppShell>
      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)]">
            I tuoi personaggi
          </h2>

          <p className="mt-2 max-w-2xl text-[var(--text-soft)]">
            Consulta i personaggi già scelti e seleziona quelli disponibili per
            le campagne tutorial.
          </p>
        </div>

        {isLoading && (
          <AppCard>
            <p className="text-[var(--text-muted)]">
              Caricamento personaggi...
            </p>
          </AppCard>
        )}

        {error && (
          <AppCard className="border-danger">
            <p role="alert" className="text-danger">
              {error}
            </p>
          </AppCard>
        )}

        {successMessage && (
          <AppCard>
            <p role="status" className="text-[var(--primary)]">
              {successMessage}
            </p>
          </AppCard>
        )}

        {initialCampaignId && campaigns.some(item => item.id === initialCampaignId) && <AppButton href={`/campaigns/${initialCampaignId}`} variant="secondary">Torna alla campagna</AppButton>}
        {!isLoading && (
          <>
            <section className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-[var(--text-main)]">
                  I tuoi personaggi
                </h3>

                <p className="mt-2 text-[var(--text-soft)]">
                  Questi sono i personaggi che hai già scelto.
                </p>
              </div>

              {myCharacters.length === 0 ? (
                <AppCard>
                  <p className="text-[var(--text-muted)]">
                    Non hai ancora scelto personaggi.
                  </p>
                </AppCard>
              ) : (
                <div className="grid items-start gap-5 xl:grid-cols-2">
                  {myCharacters.map((character) => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      campaignName={getCampaignName(character.campaignId)}
                      mode="owned"
                    />
                  ))}
                </div>
              )}
            </section>

            <section className="space-y-4">
              <div>
                <h3 className="text-2xl font-black text-[var(--text-main)]">
                  Scegli un personaggio
                </h3>

                <p className="mt-2 text-[var(--text-soft)]">
                  Seleziona una campagna e scegli uno dei personaggi preparati
                  dal Master. Confronta caratteristiche, difesa e attacchi con
                  le sfide dell’avventura. Tocca o clicca le icone info per
                  capire cosa indicano i valori.
                </p>
              </div>

              {campaigns.length === 0 && (
                <AppCard>
                  <p className="text-sm font-bold text-[var(--text-main)]">
                    Nessuna campagna disponibile.
                  </p>

                  <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Prima di scegliere un personaggio devi unirti a una
                    campagna.
                  </p>
                  <AppButton className="mt-4" href="/campaigns">Scegli una campagna</AppButton>
                </AppCard>
              )}

              {campaigns.length === 1 && (
                <AppCard>
                  <p className="text-xs font-bold uppercase tracking-[0.25em] text-[var(--accent-soft)]">
                    Campagna attiva
                  </p>

                  <h4 className="mt-2 text-xl font-black text-[var(--text-main)]">
                    {campaigns[0].name}
                  </h4>

                  <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
                    {campaigns[0].description ||
                      "Scegli uno dei personaggi disponibili per iniziare l'avventura."}
                  </p>
                </AppCard>
              )}

              {campaigns.length > 1 && (
                <AppCard>
                  <label
                    htmlFor="campaign"
                    className="block text-sm font-bold text-[var(--text-main)]"
                  >
                    Scegli campagna
                  </label>

                  <select
                    id="campaign"
                    disabled={claimingCharacterId !== null}
                    value={selectedCampaignId ?? ""}
                    onChange={(event) =>
                      handleCampaignChange(Number(event.target.value))
                    }
                    className="mt-2 w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3 text-[var(--text-main)] focus:border-[var(--accent)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)]/30"
                  >
                    <option value="" disabled>
                      Seleziona una campagna
                    </option>

                    {campaigns.map((campaign) => (
                      <option key={campaign.id} value={campaign.id}>
                        {campaign.name}
                      </option>
                    ))}
                  </select>
                  {campaigns.find(campaign => campaign.id === selectedCampaignId)?.description && <p className="mt-3 whitespace-pre-line text-sm leading-6 text-[var(--text-soft)]">{campaigns.find(campaign => campaign.id === selectedCampaignId)?.description}</p>}
                </AppCard>
              )}

              {selectedCharacter && (
                <AppCard>
                  <p role="status" className="text-sm text-[var(--text-soft)]">
                    Per questa campagna hai già scelto <strong>{selectedCharacter.name}</strong>.
                    Puoi consultare gli altri personaggi, ma puoi sceglierne solo uno per campagna.
                  </p>
                </AppCard>
              )}

              {selectedCampaignId && selectedCharacter && <AppButton href={`/campaigns/${selectedCampaignId}`}>Continua la campagna</AppButton>}
              {selectedCampaignId && isLoadingAvailable && (
                <AppCard>
                  <p className="text-[var(--text-muted)]">
                    Caricamento personaggi disponibili...
                  </p>
                </AppCard>
              )}

              {selectedCampaignId &&
                !isLoadingAvailable &&
                availableCharacters.length === 0 && (
                  <AppCard>
                    <p className="text-sm font-bold text-[var(--text-main)]">
                      Non ci sono personaggi disponibili per questa campagna.
                    </p>

                    <p className="mt-2 text-sm text-[var(--text-muted)]">
                      {selectedCharacter ? "Hai già scelto il tuo personaggio per questa campagna." : "Quando saranno disponibili nuovi personaggi, potrai sceglierli da qui."}
                    </p>
                  </AppCard>
                )}

              {availableCharacters.length > 0 && (
                <div className="grid gap-5 xl:grid-cols-2">
                  {availableCharacters.map((character) => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      campaignName={getCampaignName(character.campaignId)}
                      mode="available"
                      isClaiming={claimingCharacterId === character.id}
                      claimDisabledReason={myCharacters.some(item => item.campaignId === character.campaignId)
                        ? "Hai già scelto un personaggio per questa campagna."
                        : claimingCharacterId !== null && claimingCharacterId !== character.id ? "Attendi la scelta in corso." : undefined}
                      onClaim={handleClaim}
                    />
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </section>
    </AppShell>
  )
}
