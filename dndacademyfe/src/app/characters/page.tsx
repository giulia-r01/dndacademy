"use client"

import { useEffect, useState } from "react"

import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import CharacterCard from "@/components/characters/CharacterCard"
import { campaignService } from "@/services/campaign.service"
import { characterService } from "@/services/character.service"
import type { Campaign } from "@/types/campaign"
import type { Character } from "@/types/character"

export default function CharactersPage() {
  const [myCharacters, setMyCharacters] = useState<Character[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [availableCharacters, setAvailableCharacters] = useState<Character[]>(
    [],
  )

  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(
    null,
  )

  const [claimingCharacterId, setClaimingCharacterId] = useState<number | null>(
    null,
  )

  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingAvailable, setIsLoadingAvailable] = useState(false)
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [charactersData, campaignsData] = await Promise.all([
          characterService.getMine(),
          campaignService.getAll(),
        ])

        setMyCharacters(charactersData)
        setCampaigns(campaignsData)

        if (campaignsData.length === 1) {
          const onlyCampaign = campaignsData[0]

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
  }, [])

  async function handleCampaignChange(campaignId: number) {
    setSelectedCampaignId(campaignId)
    setAvailableCharacters([])
    setError("")
    setSuccessMessage("")
    setIsLoadingAvailable(true)

    try {
      const data = await characterService.getAvailableByCampaign(campaignId)
      setAvailableCharacters(data)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Errore nel caricamento personaggi disponibili"

      setError(message)
    } finally {
      setIsLoadingAvailable(false)
    }
  }

  async function handleClaim(characterId: number) {
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
            Personaggi
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
          <AppCard>
            <p role="alert" className="text-[var(--danger)]">
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
                <div className="grid gap-5 xl:grid-cols-2">
                  {myCharacters.map((character) => (
                    <CharacterCard
                      key={character.id}
                      character={character}
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
                  dal Master.
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
                </AppCard>
              )}

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
                      Quando il Master ne creerà di nuovi dal backoffice, potrai
                      sceglierli da qui.
                    </p>
                  </AppCard>
                )}

              {availableCharacters.length > 0 && (
                <div className="grid gap-5 xl:grid-cols-2">
                  {availableCharacters.map((character) => (
                    <CharacterCard
                      key={character.id}
                      character={character}
                      mode="available"
                      isClaiming={claimingCharacterId === character.id}
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
