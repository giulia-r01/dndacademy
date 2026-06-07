"use client"

import { useState, type FormEvent } from "react"
import Link from "next/link"
import { FiCheckCircle } from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import FormInput from "@/components/common/FormInput"
import { authService } from "@/services/auth.service"

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState("")
  const [successMessage, setSuccessMessage] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setSuccessMessage("")
    setIsLoading(true)

    try {
      await authService.forgotPassword({ email })

      setSuccessMessage(
        "Se l'email è associata a un account, riceverai le istruzioni per reimpostare la password.",
      )
      setEmail("")
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Errore durante la richiesta di recupero password"

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormInput
        label="Email"
        name="email"
        type="email"
        placeholder="nome@email.com"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

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

      <AppButton type="submit" fullWidth disabled={isLoading}>
        {isLoading ? "Invio in corso..." : "Invia istruzioni"}
      </AppButton>

      <p className="text-sm text-[var(--text-muted)]">
        Ti sei ricordata la password?{" "}
        <Link href="/login" className="hover:text-[var(--accent-soft)]">
          Torna al login
        </Link>
      </p>
    </form>
  )
}
