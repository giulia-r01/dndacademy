"use client"

import { useState, type FormEvent } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { FiAlertTriangle } from "react-icons/fi"

import AppButton from "@/components/common/AppButton"
import FormInput from "@/components/common/FormInput"
import { authService } from "@/services/auth.service"

export default function RegisterForm() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  function isPasswordValid(password: string) {
    const hasUppercase = /[A-Z]/.test(password)
    const hasNumberOrSpecial = /[0-9!@#$%^&*(),.?":{}|<>]/.test(password)

    return password.length >= 8 && hasUppercase && hasNumberOrSpecial
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setIsLoading(true)

    if (!isPasswordValid(password)) {
      setError(
        "La password deve avere almeno 8 caratteri, una lettera maiuscola e almeno un numero o carattere speciale.",
      )
      setIsLoading(false)
      return
    }

    try {
      await authService.register({
        username,
        email,
        password,
      })

      router.push("/login")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore durante la registrazione"

      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <FormInput
        label="Username"
        name="username"
        type="text"
        placeholder="Scegli il tuo username"
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />

      <FormInput
        label="Email"
        name="email"
        type="email"
        placeholder="nome@email.com"
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
      />

      <FormInput
        label="Password"
        name="password"
        type="password"
        placeholder="Almeno 8 caratteri"
        autoComplete="new-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
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

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <AppButton type="submit" fullWidth disabled={isLoading}>
        {isLoading ? "Creazione account..." : "Crea account"}
      </AppButton>

      <p className="text-sm text-[var(--text-muted)]">
        Hai già un account?{" "}
        <Link href="/login" className="hover:text-[var(--accent-soft)]">
          Accedi
        </Link>
      </p>
    </form>
  )
}
