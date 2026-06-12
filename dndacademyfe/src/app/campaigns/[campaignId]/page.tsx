"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { FiArrowLeft, FiShield, FiUsers } from "react-icons/fi"

import AppCard from "@/components/common/AppCard"
import AppShell from "@/components/layout/AppShell"
import { campaignService } from "@/services/campaign.service"
import type { PartyMember } from "@/types/campaign"

export default function CampaignDetailPage() {
  const params = useParams<{ campaignId: string }>()
  const campaignId = Number(params.campaignId)

  const [players, setPlayers] = useState<string[]>([])
  const [party, setParty] = useState<PartyMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    async function loadCampaignDetails() {
      if (Number.isNaN(campaignId)) {
        setError("ID campagna non valido")
        setIsLoading(false)
        return
      }

      try {
        const [playersData, partyData] = await Promise.all([
          campaignService.getPlayers(campaignId),
          campaignService.getParty(campaignId),
        ])

        setPlayers(playersData)
        setParty(partyData)
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento campagna"

        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadCampaignDetails()
  }, [campaignId])

  return (
    <AppShell>
      <section className="space-y-6">
        <Link
          href="/campaigns"
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-soft)] transition hover:text-[var(--accent-soft)]"
        >
          <FiArrowLeft aria-hidden="true" />
          Torna alle campagne
        </Link>

        <div>
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
            Campagna tutorial
          </p>

          <h2 className="mt-2 text-3xl font-black text-[var(--text-main)]">
            Dettaglio campagna
          </h2>

          <p className="mt-2 max-w-2xl text-[var(--text-soft)]">
            Qui puoi vedere i partecipanti e il party collegato alla campagna.
          </p>
        </div>

        {isLoading && (
          <AppCard>
            <p className="text-[var(--text-muted)]">
              Caricamento dettagli campagna...
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

        {!isLoading && !error && (
          <div className="grid gap-6 xl:grid-cols-[420px_1fr]">
            <AppCard>
              <div className="flex items-center gap-3 text-[var(--accent-soft)]">
                <FiUsers size={22} aria-hidden="true" />
                <h3 className="text-lg font-black text-[var(--text-main)]">
                  Giocatori
                </h3>
              </div>

              {players.length === 0 ? (
                <p className="mt-4 text-sm text-[var(--text-muted)]">
                  Nessun giocatore iscritto.
                </p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {players.map((player) => (
                    <li
                      key={player}
                      className="rounded-xl bg-[var(--surface-muted)] px-4 py-3 text-sm font-bold text-[var(--text-soft)]"
                    >
                      {player}
                    </li>
                  ))}
                </ul>
              )}
            </AppCard>

            <AppCard>
              <div className="flex items-center gap-3 text-[var(--accent-soft)]">
                <FiShield size={22} aria-hidden="true" />
                <h3 className="text-lg font-black text-[var(--text-main)]">
                  Party
                </h3>
              </div>

              {party.length === 0 ? (
                <div className="mt-4 rounded-xl bg-[var(--surface-muted)] px-4 py-4">
                  <p className="text-sm font-bold text-[var(--text-main)]">
                    Il party è ancora vuoto.
                  </p>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    Crea un personaggio per iniziare a partecipare alla
                    campagna.
                  </p>
                </div>
              ) : (
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  {party.map((member) => (
                    <div
                      key={`${member.playerUsername}-${member.characterName}`}
                      className="rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-4"
                    >
                      <p className="text-lg font-black text-[var(--text-main)]">
                        {member.characterName}
                      </p>

                      <p className="mt-1 text-sm text-[var(--accent-soft)]">
                        {member.characterClass} · Livello {member.level}
                      </p>

                      <p className="mt-3 text-sm text-[var(--text-muted)]">
                        Player: {member.playerUsername}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </AppCard>
          </div>
        )}
      </section>
    </AppShell>
  )
}
