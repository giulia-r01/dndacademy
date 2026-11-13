"use client"

import { useRef, useState, type FormEvent } from "react"
import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import AppModal from "@/components/common/AppModal"
import FormInput from "@/components/common/FormInput"
import { userService } from "@/services/user.service"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import type { UserProfile } from "@/types/user"

type Plan = Awaited<ReturnType<typeof userService.deletionPlan>>

export default function DeleteAccount({ user, disabled, onBusyChange }: {
  user: UserProfile; disabled: boolean; onBusyChange: (busy: boolean) => void
}) {
  const { logout } = useCurrentUser()
  const [open, setOpen] = useState(false)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [loading, setLoading] = useState(false)
  const [busy, setBusy] = useState(false)
  const [password, setPassword] = useState("")
  const [confirmed, setConfirmed] = useState(false)
  const [successor, setSuccessor] = useState("")
  const [error, setError] = useState("")
  const inFlight = useRef(false)
  const generation = useRef(0)
  const requiresTransfer = !!plan && plan.campaigns + plan.npcs > 0

  async function show() {
    const attempt = ++generation.current
    setOpen(true); setLoading(true); setPlan(null); setPassword(""); setConfirmed(false); setSuccessor(""); setError("")
    try {
      const result = await userService.deletionPlan()
      if (attempt === generation.current) setPlan(result)
    } catch (err) {
      if (attempt === generation.current) setError(err instanceof Error ? err.message : "Impossibile verificare i dati dell’account.")
    } finally {
      if (attempt === generation.current) setLoading(false)
    }
  }

  function close() {
    if (inFlight.current) return
    generation.current++; setOpen(false); setPassword(""); setConfirmed(false)
  }

  async function remove(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (inFlight.current || !plan || !confirmed || !password || (requiresTransfer && !successor)) return
    inFlight.current = true; setBusy(true); onBusyChange(true); setError("")
    try {
      await userService.deleteMe({ currentPassword: password, confirmed: true, ...(requiresTransfer ? { successorMasterId: Number(successor) } : {}) })
      try {
        for (const key of Object.keys(localStorage)) {
          if (key.startsWith("dndacademy:tour:") && key.split(":")[3] === String(user.id)) localStorage.removeItem(key)
        }
      } finally { logout("accountDeleted") }
    } catch (err) {
      setPassword("")
      setError(err instanceof Error ? err.message : "Impossibile eliminare l’account. Riprova.")
    } finally {
      inFlight.current = false; setBusy(false); onBusyChange(false)
    }
  }

  return <AppCard className="border-[var(--danger)]/50 xl:col-span-2">
    <h3 className="text-xl font-black">Elimina account</h3>
    <p className="mt-3 text-sm text-[var(--text-muted)]">Puoi eliminare definitivamente il tuo account, i personaggi personali, i progressi e lo storico. L’operazione non può essere annullata.</p>
    <AppButton variant="danger" className="mt-5" disabled={disabled} onClick={() => void show()}>Elimina il mio account</AppButton>
    <AppModal isOpen={open} onClose={close} disableClose={busy} size="sm" title="Eliminare il tuo account?" description={`Stai eliminando soltanto l’account ${user.username}.`}>
      {loading && <p role="status">Verifica dei dati in corso…</p>}
      {error && <p role="alert" className="mb-4 text-sm text-[var(--danger)]">{error}</p>}
      {!loading && !plan && <div className="flex flex-wrap gap-3"><AppButton variant="secondary" onClick={close}>Annulla</AppButton><AppButton onClick={() => void show()}>Riprova</AppButton></div>}
      {plan && <form onSubmit={(event) => void remove(event)} className="space-y-5" aria-busy={busy}>
        <p className="text-sm text-[var(--text-soft)]">Verranno rimossi account, iscrizioni alle campagne, personaggi personali, progressi, badge, combattimenti e link di recupero. Uscirai da tutte le sessioni. L’avatar sarà rimosso automaticamente anche se il servizio immagini è temporaneamente indisponibile.</p>
        {requiresTransfer && <div className="space-y-3 rounded-xl bg-[var(--surface-muted)] p-4">
          <p className="text-sm">Hai creato {plan.campaigns} campagne e {plan.npcs} PNG. Questi contenuti resteranno disponibili agli altri utenti: scegli il Master che ne prenderà la gestione.</p>
          {plan.successors.length === 0 ? <p className="text-sm text-[var(--danger)]">Non ci sono altri Master disponibili. Annulla e promuovi prima un altro utente dall’Area Master, oppure contatta il supporto.</p> : <>
            <label htmlFor="deletion-successor" className="block text-sm font-bold">Master a cui trasferire i contenuti</label>
            <select id="deletion-successor" value={successor} onChange={event => setSuccessor(event.target.value)} required disabled={busy} className="w-full rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface)] p-3">
              <option value="">Seleziona un Master</option>
              {plan.successors.map(master => <option key={master.id} value={master.id}>{master.username}</option>)}
            </select>
          </>}
        </div>}
        <FormInput label="Password attuale per eliminare l’account" name="deletionPassword" type="password" autoComplete="current-password" value={password} onChange={event => setPassword(event.target.value)} required disabled={busy} />
        <label className="flex items-start gap-3 text-sm"><input type="checkbox" checked={confirmed} onChange={event => setConfirmed(event.target.checked)} required disabled={busy} className="mt-1 shrink-0" /><span>Confermo di voler eliminare definitivamente il mio account e i miei dati personali di gioco.</span></label>
        <div className="flex flex-wrap gap-3"><AppButton variant="secondary" disabled={busy} onClick={close}>Annulla</AppButton><AppButton variant="danger" type="submit" disabled={busy || !password || !confirmed || (requiresTransfer && !successor)}>{busy ? "Eliminazione in corso…" : "Elimina definitivamente"}</AppButton></div>
      </form>}
    </AppModal>
  </AppCard>
}
