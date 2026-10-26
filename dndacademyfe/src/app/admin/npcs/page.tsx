"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { FiPlus, FiEdit2, FiTrash2 } from "react-icons/fi"
import NpcCard from "@/components/npcs/NpcCard"
import AppShell from "@/components/layout/AppShell"
import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import AppModal from "@/components/common/AppModal"
import NpcForm from "@/components/admin/npcs/NpcForm"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { npcService } from "@/services/npc.service"
import type { Npc, NpcRequest } from "@/types/npc"

export default function AdminNpcsPage() {
  const { user, isLoading: userLoading, error: userError } = useCurrentUser()
  const [npcs, setNpcs] = useState<Npc[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")
  const [formError, setFormError] = useState("")
  const [success, setSuccess] = useState("")
  const [editing, setEditing] = useState<Npc | "new" | null>(null)
  const [deleting, setDeleting] = useState<Npc | null>(null)

  const load = useCallback((isActive: () => boolean = () => true) => {
    return npcService.getAll()
      .then((available) => {
        if (!isActive()) return
        setNpcs(available)
        setError("")
      })
      .catch((e: unknown) => {
        if (!isActive()) return
        setError(e instanceof Error ? e.message : "Impossibile caricare gli NPC")
      })
      .finally(() => {
        if (isActive()) setLoading(false)
      })
  }, [])

  useEffect(() => {
    let active = true
    if (user?.role === "MASTER") void load(() => active)
    return () => {
      active = false
    }
  }, [user?.role, load])

  async function reload() {
    setLoading(true)
    await load()
  }

  async function save(payload: NpcRequest, image: File | null) {
    setSaving(true)
    setFormError("")
    try {
      const saved = editing && editing !== "new"
        ? await npcService.update(editing.id, payload)
        : await npcService.create(payload)
      setError("")
      let imageError = ""
      if (image) {
        try { await npcService.uploadImage(saved.id, image) }
        catch (err) { imageError = `Scheda salvata. Immagine non caricata: ${err instanceof Error ? err.message : "riprova dalla scheda"}` }
      }
      setEditing(null)
      setSuccess("NPC salvato correttamente.")
      await reload()
      if (imageError) setError(imageError)
      return true
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Errore nel salvataggio")
      return false
    } finally {
      setSaving(false)
    }
  }

  async function uploadImage(npc: Npc, file: File) {
    if (saving) return
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) {
      setError("Scegli un'immagine JPG, PNG o WEBP fino a 5 MB.")
      return
    }
    setSaving(true)
    setError("")
    setSuccess("")
    try {
      const updated = await npcService.uploadImage(npc.id, file)
      setNpcs(previous => previous.map(item => item.id === updated.id ? updated : item))
      setSuccess("Immagine salvata.")
    } catch (e) {
      setError(e instanceof Error ? e.message : "Impossibile caricare l'immagine")
    } finally { setSaving(false) }
  }

  async function remove() {
    if (!deleting) return
    setSaving(true)
    setError("")
    try {
      await npcService.delete(deleting.id)
      setDeleting(null)
      setSuccess("NPC eliminato.")
      await reload()
    } catch (e) {
      setDeleting(null)
      setError(e instanceof Error ? e.message : "Impossibile eliminare l'NPC")
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
          href="/admin"
          className="text-sm font-bold text-[var(--accent-soft)] hover:underline"
        >
          ← Torna al backoffice
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">
              Backoffice
            </p>
            <h1 className="mt-2 text-3xl font-black">Gestione nemici e aiutanti</h1>
            <p className="mt-2 text-[var(--text-soft)]">
              Crea nemici e alleati da riutilizzare negli incontri delle tue
              campagne.
            </p>
          </div>
          <AppButton
            type="button"
            onClick={() => {
              setEditing("new")
              setFormError("")
              setSuccess("")
            }}
          >
            <FiPlus className="mr-2" aria-hidden="true" /> Nuovo NPC
          </AppButton>
        </div>
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
          <AppCard>Caricamento NPC...</AppCard>
        ) : !error && npcs.length === 0 ? (
          <AppCard>
            Nessun NPC. Crea il primo nemico per configurare un incontro.
          </AppCard>
        ) : (
          <div className="space-y-6">
            {npcs.map(npc => <section key={npc.id} aria-label={npc.name} className="space-y-3">
              <NpcCard npc={npc} />
              <AppCard className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div><p className="font-bold">Azioni Master</p><p className="mt-1 text-xs text-[var(--text-muted)]">Gestisci la scheda e il ritratto di {npc.name}.</p></div>
                <div className="flex flex-wrap items-center gap-3">
                  <label className={`rounded-xl border border-[var(--border-teal-soft)] px-5 py-3 text-sm font-bold focus-within:ring-2 focus-within:ring-[var(--accent)] ${saving ? "cursor-wait opacity-60" : "cursor-pointer hover:bg-[var(--surface-muted)]"}`}>
                    {npc.imageUrl ? "Cambia immagine" : "Aggiungi immagine"}
                    <input type="file" aria-label={`Immagine di ${npc.name}`} accept="image/jpeg,image/png,image/webp" disabled={saving} className="sr-only" onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void uploadImage(npc, file) }} />
                  </label>
                  <AppButton type="button" disabled={saving} variant="secondary" onClick={() => { setEditing(npc); setFormError("") }}><FiEdit2 className="mr-2" aria-hidden="true" /> Modifica</AppButton>
                  <AppButton type="button" disabled={saving} variant="danger" onClick={() => setDeleting(npc)}><FiTrash2 className="mr-2" aria-hidden="true" /> Elimina</AppButton>
                </div>
              </AppCard>
            </section>)}
          </div>
        )}

        <AppModal
          isOpen={editing !== null}
          title={editing === "new" ? "Nuovo NPC" : "Modifica NPC"}
          description="Definisci le caratteristiche utilizzate dal motore di combattimento."
          onClose={() => {
            if (!saving) setEditing(null)
          }}
          size="xl"
        >
          {editing !== null && (
            <NpcForm
              key={editing === "new" ? "new" : editing.id}
              initial={editing === "new" ? null : editing}
              isSaving={saving}
              error={formError}
              onSave={save}
              onCancel={() => setEditing(null)}
            />
          )}
        </AppModal>
        <AppModal
          isOpen={deleting !== null}
          title="Eliminare l'NPC?"
          description="L'operazione non può essere annullata."
          onClose={() => {
            if (!saving) setDeleting(null)
          }}
          size="sm"
        >
          <p className="mb-5 text-sm text-[var(--text-soft)]">
            Vuoi eliminare <strong>{deleting?.name}</strong>? Se è già
            utilizzato in un incontro o combattimento il backend impedirà
            l`eliminazione.
          </p>
          <div className="flex justify-end gap-3">
            <AppButton
              type="button"
              variant="secondary"
              disabled={saving}
              onClick={() => setDeleting(null)}
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
      </section>
    </AppShell>
  )
}
