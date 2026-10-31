"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import FormInput from "@/components/common/FormInput"
import { authService } from "@/services/auth.service"
import { isPasswordValid, passwordHint } from "@/lib/password"

type ResetPasswordFormProps = {
  initialToken: string
}

export default function ResetPasswordForm({
  initialToken,
}: ResetPasswordFormProps) {
  const router = useRouter()

  const [newPassword, setNewPassword] = useState("")
  const [error, setError] = useState(
    initialToken ? "" : "Token di recupero password mancante.",
  )
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (initialToken) {
      window.history.replaceState(null, "", "/reset-password")
    }
  }, [initialToken])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setSuccessMessage("")

    if (!initialToken) {
      setError("Token di recupero password non valido.")
      return
    }

    if (!isPasswordValid(newPassword)) {
      setError(
        passwordHint,
      )
      return
    }

    setIsLoading(true)

    try {
      await authService.resetPassword({
        token: initialToken,
        newPassword,
      })

      setSuccessMessage("Password aggiornata correttamente.")

      setTimeout(() => {
        router.push("/login")
      }, 1200)
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Errore durante il reset della password"

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormInput
        label="Nuova password"
        name="newPassword"
        type="password"
        placeholder="Inserisci la nuova password"
        autoComplete="new-password"
        required
        minLength={8}
        value={newPassword}
        onChange={(event) => setNewPassword(event.target.value)}
      />

      <div
        className="flex items-start gap-2 rounded-xl border border-[var(--border-gold)]/30 bg-[var(--surface-muted)] px-4 py-3"
        role="note"
      >
        <FiAlertTriangle
          className="mt-0.5 shrink-0 text-[var(--accent)]"
          size={18}
          aria-hidden="true"
        />

        <p className="text-sm leading-6 text-[var(--text-muted)]">
          {passwordHint}
        </p>
      </div>

      {successMessage && (
        <div
          className="flex items-start gap-2 rounded-xl border border-[var(--primary)]/40 bg-[var(--surface-muted)] px-4 py-3"
          role="status"
        >
          <FiCheckCircle
            className="mt-0.5 shrink-0 text-[var(--primary)]"
            size={18}
            aria-hidden="true"
          />

          <p className="text-sm leading-6 text-[var(--text-soft)]">
            {successMessage}
          </p>
        </div>
      )}

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <AppButton type="submit" fullWidth disabled={isLoading || !initialToken}>
        {isLoading ? "Aggiornamento..." : "Aggiorna password"}
      </AppButton>

      <p className="text-sm text-[var(--text-muted)]">
        Vuoi tornare indietro?{" "}
        <Link href="/login" className="hover:text-[var(--accent-soft)]">
          Vai al login
        </Link>
      </p>
    </form>
  )
}
