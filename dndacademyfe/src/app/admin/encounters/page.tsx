"use client"

import { Suspense, useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import AppModal from "@/components/common/AppModal"
import EncounterOverview from "@/components/admin/encounters/EncounterOverview"
import { campaignService } from "@/services/campaign.service"
import type { CampaignChapter } from "@/types/campaign-chapter"
import EncounterForm from "@/components/admin/encounters/EncounterForm"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { npcService } from "@/services/npc.service"
import { encounterService } from "@/services/encounter.service"
import type { Encounter, EncounterRequest } from "@/types/encounter"
import type { Npc } from "@/types/npc"

export default function AdminEncountersPage() {
  return (
    <Suspense
      fallback={
        <AppShell>
          <AppCard>Caricamento incontri...</AppCard>
        </AppShell>
      }
    >
      <Content />
    </Suspense>
  )
}

function Content() {
  const params = useSearchParams()
  const chapterParam = Number(params.get("chapterId"))
  const campaignParam = Number(params.get("campaignId"))
  const chapterId =
    Number.isSafeInteger(chapterParam) && chapterParam > 0 ? chapterParam : null
  const campaignId =
    Number.isSafeInteger(campaignParam) && campaignParam > 0
      ? campaignParam
      : null
  return (
    <EncounterContent
      key={`${campaignId}-${chapterId}`}
      chapterId={chapterId}
      campaignId={campaignId}
    />
  )
}

function EncounterContent({
  chapterId,
  campaignId,
}: {
  chapterId: number | null
  campaignId: number | null
}) {
  const { user, isLoading: userLoading, error: userError } = useCurrentUser()
  const [chapter, setChapter] = useState<CampaignChapter | null>(null)
  const [encounter, setEncounter] = useState<Encounter | null>(null)
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formError, setFormError] = useState("")
  const [success, setSuccess] = useState("")
  const [formOpen, setFormOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const load = useCallback((isActive: () => boolean = () => true) => {
    if (chapterId === null) return
    return Promise.all([
      encounterService.getByChapter(chapterId),
      npcService.getAll(),
      campaignId ? campaignService.getChaptersByCampaign(campaignId) : Promise.resolve([]),
    ])
      .then(([found, available, chapters]) => {
        if (!isActive()) return
        const selectedChapter = chapters.find(item => item.id === chapterId)
        if (campaignId && !selectedChapter) throw new Error("Capitolo non disponibile per questa campagna.")
        setChapter(selectedChapter ?? null)
        setEncounter(found[0] ?? null)
        setNpcs(available)
        setError("")
      })
      .catch((e: unknown) => {
        if (!isActive()) return
        setError(
          e instanceof Error ? e.message : "Impossibile caricare l'incontro",
        )
      })
      .finally(() => {
        if (isActive()) setLoading(false)
      })
  }, [chapterId, campaignId])

  useEffect(() => {
    let active = true
    if (user?.role === "MASTER" && chapterId !== null) void load(() => active)
    return () => {
      active = false
    }
  }, [user?.role, chapterId, load])

  async function reload() {
    setLoading(true)
    await load()
  }

  async function save(payload: EncounterRequest) {
    setSaving(true)
    setFormError("")
    try {
      if (encounter) await encounterService.update(encounter.id, payload)
      else await encounterService.create(payload)
      setFormOpen(false)
      setSuccess("Incontro salvato correttamente.")
      await reload()
      return true
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Errore nel salvataggio")
      return false
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!encounter) return
    setSaving(true)
    setError("")
    try {
      await encounterService.delete(encounter.id)
      setDeleteOpen(false)
      setSuccess("Incontro eliminato.")
      await reload()
    } catch (e) {
      setDeleteOpen(false)
      setError(
        e instanceof Error ? e.message : "Impossibile eliminare l'incontro",
      )
    } finally {
      setSaving(false)
    }
  }

  if (userLoading)
    return (
      <AppShell>
        <AppCard>Verifica permessi Master...</AppCard>
      </AppShell>
    )
  if (userError || user?.role !== "MASTER")
    return (
      <AppShell>
        <AppCard>
          <p role="alert" className="text-[var(--danger)]">
            {userError ?? "Accesso riservato agli utenti Master."}
          </p>
        </AppCard>
      </AppShell>
    )

  return (
    <AppShell>
      <section className="space-y-6">
        <Link
          href={
            campaignId
              ? `/admin/campaigns/${campaignId}/chapters`
              : "/admin/campaigns"
          }
          className="text-sm font-bold text-[var(--accent-soft)] hover:underline"
        >
          ← Torna ai capitoli
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
              Backoffice campagna
            </p>
            <h1 className="mt-2 text-3xl font-black">Gestione incontro</h1>
            <p className="mt-2 text-[var(--text-soft)]">
              {chapterId
                ? chapter ? `${chapter.campaignName} · Capitolo ${chapter.orderIndex}: ${chapter.title}` : "Prepara i partecipanti e la storia dello scontro."
                : "Seleziona prima un capitolo."}
            </p>
          </div>
          {chapterId && encounter && !loading && !error && (
            <AppButton
              type="button"
              onClick={() => {
                setFormError("")
                setFormOpen(true)
              }}
            >
              {encounter ? "Modifica incontro" : "Crea incontro"}
            </AppButton>
          )}
        </div>
        {chapterId === null ? (
          <AppCard>
            Apri gli incontri dalla pagina dei capitoli di una campagna.
          </AppCard>
        ) : (
          <>
            {error && (
              <AppCard>
                <p role="alert" className="text-[var(--danger)]">
                  {error}
                </p>
                <AppButton
                  type="button"
                  variant="secondary"
                  onClick={() => void reload()}
                >
                  Riprova
                </AppButton>
              </AppCard>
            )}
            {success && (
              <p role="status" className="text-[var(--primary)]">
                {success}
              </p>
            )}
            {loading ? (
              <AppCard>Caricamento incontro...</AppCard>
            ) : (
              !error &&
              <EncounterOverview encounter={encounter} npcs={npcs} onConfigure={() => { setFormError(""); setFormOpen(true) }} onDelete={() => setDeleteOpen(true)} />
            )}
            <AppModal
              isOpen={formOpen}
              title={encounter ? "Modifica incontro" : "Nuovo incontro"}
              description="Seleziona gli NPC e la quantità di ciascuno. Almeno un nemico è obbligatorio."
              onClose={() => {
                if (!saving) setFormOpen(false)
              }}
              size="lg"
            >
              {formOpen && (
                <EncounterForm
                  chapterId={chapterId}
                  initial={encounter}
                  npcs={npcs}
                  isSaving={saving}
                  error={formError}
                  onSave={save}
                  onCancel={() => setFormOpen(false)}
                />
              )}
            </AppModal>
            <AppModal
              isOpen={deleteOpen}
              title="Eliminare l'incontro?"
              description="Non puoi eliminare un incontro già utilizzato in un combattimento."
              onClose={() => {
                if (!saving) setDeleteOpen(false)
              }}
              size="sm"
            >
              <p className="mb-5 text-sm text-[var(--text-soft)]">
                Eliminare definitivamente <strong>{encounter?.title}</strong>?
              </p>
              <div className="flex justify-end gap-3">
                <AppButton
                  type="button"
                  variant="secondary"
                  disabled={saving}
                  onClick={() => setDeleteOpen(false)}
                >
                  Annulla
                </AppButton>
                <AppButton
                  type="button"
                  variant="danger"
                  disabled={saving}
                  onClick={() => void remove()}
                >
                  {saving ? "Eliminazione..." : "Elimina"}
                </AppButton>
              </div>
            </AppModal>
          </>
        )}
      </section>
    </AppShell>
  )
}
