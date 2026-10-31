"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { FiArrowLeft, FiBookOpen, FiShield, FiUsers } from "react-icons/fi"
import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppModal from "@/components/common/AppModal"
import StatCard from "@/components/dashboard/StatCard"
import AppShell from "@/components/layout/AppShell"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { userService } from "@/services/user.service"
import type { LearningLevel, UserProfile, UserRole } from "@/types/user"

const levels: Record<LearningLevel, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzato",
}
const fieldClass = "w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface)] px-4 py-3 text-[var(--text-main)]"

export default function AdminUsersPage() {
  const { user, isLoading: checkingUser, error: userError } = useCurrentUser()
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [reload, setReload] = useState(0)
  const [search, setSearch] = useState("")
  const [roleFilter, setRoleFilter] = useState<UserRole | "">("")
  const [levelFilter, setLevelFilter] = useState<LearningLevel | "">("")
  const [pending, setPending] = useState<UserProfile | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState("")
  const saveInFlight = useRef(false)

  useEffect(() => {
    if (user?.role !== "MASTER") return
    let active = true
    userService.getAll().then((result) => {
      if (active) setUsers(result)
    }).catch((err: unknown) => {
      if (active) setError(err instanceof Error ? err.message : "Impossibile caricare gli utenti.")
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [user?.role, reload])

  async function confirmRoleChange() {
    if (!pending || pending.id === user?.id || saveInFlight.current) return
    saveInFlight.current = true
    setSaving(true)
    setSaveError("")
    const nextRole = pending.role === "PLAYER" ? "MASTER" : "PLAYER"
    try {
      const updated = await userService.updateRole(pending.id, nextRole)
      setUsers((current) => current.map((item) => item.id === updated.id ? updated : item))
      setSuccess(`Il ruolo di ${updated.username} è ora ${updated.role === "MASTER" ? "Master" : "Player"}.`)
      setPending(null)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Impossibile aggiornare il ruolo.")
    } finally {
      saveInFlight.current = false
      setSaving(false)
    }
  }

  function closeModal() {
    if (!saveInFlight.current) setPending(null)
  }

  if (checkingUser || userError || user?.role !== "MASTER") {
    return <AppShell><AppCard><p role={checkingUser ? "status" : "alert"}>
      {checkingUser ? "Verifica permessi Master..." : userError || "Accesso riservato agli utenti Master."}
    </p></AppCard></AppShell>
  }

  const masterCount = users.filter((item) => item.role === "MASTER").length
  const query = search.trim().toLocaleLowerCase("it")
  const filtered = users.filter((item) =>
    (!roleFilter || item.role === roleFilter) &&
    (!levelFilter || item.learningLevel === levelFilter) &&
    (!query || `${item.username} ${item.email}`.toLocaleLowerCase("it").includes(query))
  )

  return <AppShell>
    <section className="space-y-6">
      <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-bold text-[var(--text-soft)]">
        <FiArrowLeft aria-hidden="true" /> Torna al backoffice
      </Link>
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.3em] text-[var(--accent-soft)]">Backoffice</p>
        <h2 className="mt-2 text-3xl font-black">Utenti e statistiche</h2>
        <p className="mt-2 text-[var(--text-soft)]">Consulta gli iscritti, i livelli di apprendimento e gestisci i ruoli.</p>
      </div>
      {success && <AppCard><p role="status" className="text-[var(--primary)]">{success}</p></AppCard>}
      {loading ? <AppCard><p role="status">Caricamento utenti...</p></AppCard> : error ? <AppCard>
        <p role="alert" className="text-[var(--danger)]">{error}</p>
        <AppButton className="mt-4" onClick={() => { setError(""); setLoading(true); setReload((value) => value + 1) }}>Riprova</AppButton>
      </AppCard> : <>
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard title="Utenti totali" value={String(users.length)} icon={<FiUsers size={22} aria-hidden="true" />} />
          <StatCard title="Master" value={String(masterCount)} icon={<FiShield size={22} aria-hidden="true" />} />
          <StatCard title="Player" value={String(users.length - masterCount)} icon={<FiUsers size={22} aria-hidden="true" />} />
        </div>
        <AppCard>
          <h3 className="flex items-center gap-2 text-lg font-black"><FiBookOpen aria-hidden="true" /> Livelli di apprendimento</h3>
          <p className="mt-2 text-sm text-[var(--text-muted)]">Distribuzione di tutti gli iscritti, indipendente dai filtri.</p>
          <dl className="mt-4 grid gap-4 sm:grid-cols-3">
            {Object.entries(levels).map(([level, label]) => <div key={level} className="rounded-xl bg-[var(--surface-muted)] p-4">
              <dt className="text-sm text-[var(--text-soft)]">{label}</dt>
              <dd className="mt-1 text-2xl font-black">{users.filter((item) => item.learningLevel === level).length}</dd>
            </div>)}
          </dl>
        </AppCard>
        <AppCard>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-2 text-sm font-bold">Cerca utente
              <input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Username o email" className={fieldClass} />
            </label>
            <label className="space-y-2 text-sm font-bold">Ruolo
              <select value={roleFilter} onChange={(event) => setRoleFilter(event.target.value as UserRole | "")} className={fieldClass}>
                <option value="">Tutti i ruoli</option><option value="MASTER">Master</option><option value="PLAYER">Player</option>
              </select>
            </label>
            <label className="space-y-2 text-sm font-bold">Livello di apprendimento
              <select value={levelFilter} onChange={(event) => setLevelFilter(event.target.value as LearningLevel | "")} className={fieldClass}>
                <option value="">Tutti i livelli</option>
                {Object.entries(levels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
            </label>
          </div>
          <p role="status" className="mt-4 text-sm text-[var(--text-muted)]">{filtered.length} utenti su {users.length}</p>
        </AppCard>
        {filtered.length === 0 ? <AppCard><p>{users.length === 0 ? "Non ci sono ancora utenti." : "Nessun utente corrisponde ai filtri selezionati."}</p></AppCard> :
          <div className="grid gap-4 xl:grid-cols-2">
            {filtered.map((item) => <AppCard key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="break-words text-lg font-black">{item.username}{item.id === user.id && " (tu)"}</h3>
                  <p className="mt-1 break-all text-sm text-[var(--text-muted)]">{item.email}</p>
                </div>
                <span className="rounded-full bg-[var(--surface-muted)] px-3 py-1 text-sm font-bold text-[var(--accent-soft)]">{item.role === "MASTER" ? "Master" : "Player"}</span>
              </div>
              <p className="mt-4 text-sm text-[var(--text-soft)]">Livello: {levels[item.learningLevel]}</p>
              <div className="mt-4">
                {item.id === user.id ? <p className="text-sm text-[var(--text-muted)]">Non puoi modificare il tuo ruolo.</p> :
                  <AppButton variant="secondary" disabled={saving} onClick={() => { setSuccess(""); setSaveError(""); setPending(item) }}>
                    {item.role === "PLAYER" ? "Rendi Master" : "Riporta a Player"}
                    <span className="sr-only">: {item.username}</span>
                  </AppButton>}
              </div>
            </AppCard>)}
          </div>}
      </>}
      <AppModal isOpen={pending !== null} title="Conferma cambio ruolo" onClose={closeModal} size="sm">
        <div className="space-y-5">
          <p>Vuoi {pending?.role === "PLAYER" ? "rendere Master" : "riportare a Player"} <strong>{pending?.username}</strong>?</p>
          <p className="text-sm text-[var(--text-soft)]">{pending?.role === "PLAYER" ? "L’utente potrà accedere al backoffice e gestire contenuti e ruoli degli utenti." : "L’utente perderà l’accesso al backoffice e potrà continuare a utilizzare le funzioni Player."}</p>
          {saveError && <p role="alert" className="text-[var(--danger)]">{saveError}</p>}
          <div className="flex flex-wrap justify-end gap-3">
            <AppButton variant="secondary" disabled={saving} onClick={closeModal}>Annulla</AppButton>
            <AppButton disabled={saving} onClick={confirmRoleChange}>{saving ? "Salvataggio..." : "Conferma"}</AppButton>
          </div>
        </div>
      </AppModal>
    </section>
  </AppShell>
}
