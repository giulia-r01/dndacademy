"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

import AppButton from "@/components/common/AppButton"
import FormInput from "@/components/common/FormInput"
import { authService } from "@/services/auth.service"

export default function LoginForm() {
  const router = useRouter()

  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setError("")
    setIsLoading(true)

    try {
      const response = await authService.login({
        username,
        password,
      })

      localStorage.setItem("token", response.token)

      router.push("/dashboard")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Errore durante il login"

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
        placeholder="Il tuo username"
        autoComplete="username"
        value={username}
        onChange={(event) => setUsername(event.target.value)}
      />

      <FormInput
        label="Password"
        name="password"
        type="password"
        placeholder="La tua password"
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />

      {error && (
        <p
          role="alert"
          className="rounded-xl border border-danger px-4 py-3 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <AppButton type="submit" fullWidth disabled={isLoading}>
        {isLoading ? "Accesso in corso..." : "Accedi"}
      </AppButton>

      <div className="flex flex-col gap-2 text-sm text-[var(--text-muted)]">
        <Link
          href="/forgot-password"
          className="hover:text-[var(--accent-soft)]"
        >
          Hai dimenticato la password?
        </Link>

        <Link href="/register" className="hover:text-[var(--accent-soft)]">
          Non hai un account? Registrati
        </Link>
      </div>
    </form>
  )
}
