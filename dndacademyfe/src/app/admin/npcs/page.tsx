"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
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

  async function save(payload: NpcRequest) {
    setSaving(true)
    setFormError("")
    try {
      if (editing && editing !== "new")
        await npcService.update(editing.id, payload)
      else await npcService.create(payload)
      setEditing(null)
      setSuccess("NPC salvato correttamente.")
      await reload()
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
            <h1 className="mt-2 text-3xl font-black">NPC</h1>
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
            Nuovo NPC
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
          <div className="grid gap-4 md:grid-cols-2">
            {npcs.map((npc) => (
              <AppCard key={npc.id}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-black">{npc.name}</h2>
                    <p className="mt-1 text-sm text-[var(--accent-soft)]">
                      {npc.enemy ? "Nemico" : "Alleato"}
                    </p>
                  </div>
                  <p className="text-sm font-bold">
                    HP {npc.maxHp} · CA {npc.armorClass}
                  </p>
                </div>
                <div className="mt-3 flex items-center gap-4">
                  {npc.imageUrl && <Image unoptimized src={npc.imageUrl} alt={npc.name} width={80} height={80} className="h-20 w-20 rounded-xl object-cover" />}
                  <label className="text-sm font-bold">
                    {npc.imageUrl ? "Cambia immagine" : "Aggiungi immagine"}
                    <input type="file" accept="image/jpeg,image/png,image/webp" disabled={saving}
                      className="mt-2 block max-w-full text-sm"
                      onChange={event => {
                        const file = event.target.files?.[0]
                        event.target.value = ""
                        if (file) void uploadImage(npc, file)
                      }} />
                    <span className="text-xs text-[var(--text-soft)]">JPG, PNG o WEBP · massimo 5 MB</span>
                  </label>
                </div>
                {npc.description && (
                  <p className="mt-3 text-sm text-[var(--text-soft)]">
                    {npc.description}
                  </p>
                )}
                <p className="mt-3 text-sm text-[var(--text-soft)]">
                  DES {npc.dexterity} · Attacco{" "}
                  {npc.attackModifier >= 0 ? "+" : ""}
                  {npc.attackModifier} · Danno d{npc.damageDie}
                  {npc.damageModifier >= 0 ? "+" : ""}
                  {npc.damageModifier}
                </p>
                <div className="mt-4 flex gap-3">
                  <AppButton
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setEditing(npc)
                      setFormError("")
                    }}
                  >
                    Modifica
                  </AppButton>
                  <AppButton
                    type="button"
                    variant="danger"
                    onClick={() => setDeleting(npc)}
                  >
                    Elimina
                  </AppButton>
                </div>
              </AppCard>
            ))}
          </div>
        )}
        <AppModal
          isOpen={editing !== null}
          title={editing === "new" ? "Nuovo NPC" : "Modifica NPC"}
          description="Definisci le caratteristiche utilizzate dal motore di combattimento."
          onClose={() => {
            if (!saving) setEditing(null)
          }}
          size="lg"
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
