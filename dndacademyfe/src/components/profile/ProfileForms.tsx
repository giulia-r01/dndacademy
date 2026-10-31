"use client"

import { useRef, useState, type FormEvent } from "react"
import Link from "next/link"
import { FiAward, FiLock, FiUser } from "react-icons/fi"
import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import FormInput from "@/components/common/FormInput"
import UserAvatar from "@/components/common/UserAvatar"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { userService } from "@/services/user.service"
import { isPasswordValid, passwordHint } from "@/lib/password"
import type { UserProfile } from "@/types/user"

const levels = { BEGINNER: "Principiante", INTERMEDIATE: "Intermedio", ADVANCED: "Avanzato" }
const errorMessage = (err: unknown) => err instanceof Error ? err.message : "Impossibile completare l’operazione."

export default function ProfileForms({ user }: { user: UserProfile }) {
  const { updateUser, logout } = useCurrentUser()
  const [username, setUsername] = useState(user.username)
  const [email, setEmail] = useState(user.email)
  const [currentPassword, setCurrentPassword] = useState("")
  const [oldPassword, setOldPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<"account" | "password" | "avatar" | null>(null)
  const inFlight = useRef(false)
  const [feedback, setFeedback] = useState<{ section: string; error?: string; success?: string } | null>(null)

  async function perform(section: "account" | "password" | "avatar", operation: () => Promise<void>) {
    if (inFlight.current) return
    inFlight.current = true
    setBusy(section)
    setFeedback(null)
    try { await operation() }
    catch (err) { setFeedback({ section, error: errorMessage(err) }) }
    finally { inFlight.current = false; setBusy(null) }
  }

  function status(section: string) {
    if (feedback?.section !== section) return null
    return feedback.error ? <p role="alert" className="text-sm text-[var(--danger)]">{feedback.error}</p> :
      <p role="status" className="text-sm text-[var(--primary)]">{feedback.success}</p>
  }

  function saveAccount(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    void perform("account", async () => {
      const updated = await userService.updateMe({ username, email: email.trim(), currentPassword })
      updateUser(updated)
      setUsername(updated.username)
      setEmail(updated.email)
      setCurrentPassword("")
      setFeedback({ section: "account", success: "Dati del profilo aggiornati." })
    })
  }

  function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!isPasswordValid(newPassword)) { setFeedback({ section: "password", error: passwordHint }); return }
    if (newPassword !== confirmPassword) { setFeedback({ section: "password", error: "Le nuove password non coincidono." }); return }
    if (oldPassword === newPassword) { setFeedback({ section: "password", error: "Scegli una password diversa da quella attuale." }); return }
    void perform("password", async () => {
      await userService.changePassword({ currentPassword: oldPassword, newPassword })
      setOldPassword(""); setNewPassword(""); setConfirmPassword("")
      logout("passwordChanged")
    })
  }

  function selectFile(selected: File | null) {
    setFeedback(null)
    setFile(null)
    if (!selected) return
    if (!["image/jpeg", "image/png", "image/webp"].includes(selected.type) || selected.size > 5 * 1024 * 1024 || selected.size === 0) {
      setFeedback({ section: "avatar", error: "Scegli un’immagine JPG, PNG o WEBP, fino a 5 MB." })
      if (fileInput.current) fileInput.current.value = ""
      return
    }
    setFile(selected)
  }

  function saveAvatar(remove: boolean) {
    if (!remove && !file) return
    void perform("avatar", async () => {
      const updated = remove ? await userService.removeAvatar() : await userService.uploadAvatar(file!)
      updateUser(updated)
      setFile(null)
      if (fileInput.current) fileInput.current.value = ""
      setFeedback({ section: "avatar", success: remove ? "Immagine profilo rimossa." : "Immagine profilo aggiornata." })
    })
  }

  return <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
    <AppCard className="space-y-5">
      <div className="flex flex-wrap items-center gap-5">
        <UserAvatar username={user.username} avatarUrl={user.avatarUrl} large />
        <div className="min-w-0">
          <h3 className="break-words text-2xl font-black">{user.username}</h3>
          <p className="mt-1 text-[var(--accent-soft)]">{user.role === "MASTER" ? "Master" : "Player"}</p>
          <p className="mt-1 text-sm text-[var(--text-soft)]">Livello: {levels[user.learningLevel]}</p>
        </div>
      </div>
      <p className="text-sm text-[var(--text-muted)]">Il livello aumenta completando lezioni e quiz. Il ruolo viene gestito dai Master.</p>
      <div className="space-y-3 border-t border-[var(--border-teal-soft)] pt-5">
        <label htmlFor="avatar" className="block font-bold">Immagine profilo</label>
        <p id="avatar-help" className="text-sm text-[var(--text-muted)]">JPG, PNG o WEBP. Massimo 5 MB.</p>
        <input ref={fileInput} id="avatar" type="file" accept="image/jpeg,image/png,image/webp" aria-describedby="avatar-help" disabled={busy !== null} onChange={(event) => selectFile(event.target.files?.[0] ?? null)} className="block w-full min-w-0 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[var(--surface-muted)] file:px-3 file:py-2 file:text-[var(--text-main)]" />
        <div className="flex flex-wrap gap-3">
          <AppButton disabled={!file || busy !== null} onClick={() => saveAvatar(false)}>{busy === "avatar" ? "Aggiornamento..." : "Carica immagine"}</AppButton>
          {user.avatarUrl && <AppButton variant="secondary" disabled={busy !== null} onClick={() => saveAvatar(true)}>Rimuovi immagine</AppButton>}
        </div>
        {status("avatar")}
      </div>
      <Link href="/achievements" className="inline-flex items-center gap-2 font-bold text-[var(--accent-soft)]"><FiAward aria-hidden="true" /> I tuoi badge</Link>
    </AppCard>
    <div className="space-y-6">
      <AppCard>
        <h3 className="mb-5 flex items-center gap-2 text-xl font-black"><FiUser aria-hidden="true" /> Dati account</h3>
        <form onSubmit={saveAccount} className="space-y-4">
          <FormInput label="Username" name="username" value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required minLength={3} maxLength={40} pattern="[A-Za-z0-9_.\-]{3,40}" title="Da 3 a 40 lettere, numeri, punti, trattini o underscore" disabled={busy !== null} />
          <FormInput label="Email" name="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required maxLength={254} disabled={busy !== null} />
          <FormInput label="Password attuale per confermare i dati" name="accountPassword" type="password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} autoComplete="current-password" required disabled={busy !== null} />
          {status("account")}
          <AppButton type="submit" disabled={busy !== null || (username === user.username && email.trim() === user.email)}>{busy === "account" ? "Salvataggio..." : "Salva dati"}</AppButton>
        </form>
      </AppCard>
      <AppCard>
        <h3 className="mb-3 flex items-center gap-2 text-xl font-black"><FiLock aria-hidden="true" /> Cambia password</h3>
        <p className="mb-5 text-sm text-[var(--text-muted)]">Dopo il cambio dovrai accedere di nuovo. Le sessioni precedenti verranno disconnesse.</p>
        <form onSubmit={savePassword} className="space-y-4">
          <FormInput label="Password attuale" name="currentPassword" type="password" value={oldPassword} onChange={(event) => setOldPassword(event.target.value)} autoComplete="current-password" required disabled={busy !== null} />
          <FormInput label="Nuova password" name="newPassword" type="password" value={newPassword} onChange={(event) => setNewPassword(event.target.value)} autoComplete="new-password" required minLength={8} disabled={busy !== null} />
          <p className="text-sm text-[var(--text-muted)]">{passwordHint}</p>
          <FormInput label="Conferma nuova password" name="confirmPassword" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required disabled={busy !== null} />
          {status("password")}
          <AppButton type="submit" disabled={busy !== null}>{busy === "password" ? "Aggiornamento..." : "Aggiorna password"}</AppButton>
        </form>
      </AppCard>
    </div>
  </div>
}
