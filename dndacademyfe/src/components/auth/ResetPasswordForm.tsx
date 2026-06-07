"use client"

import { useEffect, useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FiAlertTriangle, FiCheckCircle } from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import FormInput from "@/components/common/FormInput"
import { authService } from "@/services/auth.service"

type ResetPasswordFormProps = {
  initialToken: string
}

function isPasswordValid(password: string) {
  const hasUppercase = /[A-Z]/.test(password)
  const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password)

  return password.length >= 8 && hasUppercase && hasNumberOrSpecial
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
        "La password deve avere almeno 8 caratteri, una lettera maiuscola e almeno un numero o carattere speciale.",
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
          La password deve avere almeno <strong>8 caratteri</strong>, una{" "}
          <strong>lettera maiuscola</strong> e almeno un{" "}
          <strong>numero o carattere speciale</strong>.
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
        <p role="alert" className="text-sm text-[var(--danger)]">
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
