"use client"

import { useEffect, useState } from "react"

import { userService } from "@/services/user.service"
import type { UserProfile } from "@/types/user"

type UseCurrentUserResult = {
  user: UserProfile | null
  isLoading: boolean
  error: string
}

export function useCurrentUser(): UseCurrentUserResult {
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    let isMounted = true

    async function loadUser() {
      try {
        const profile = await userService.getMe()

        if (isMounted) {
          setUser(profile)
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Errore nel caricamento utente"

        if (isMounted) {
          setError(message)
        }
      } finally {
        if (isMounted) {
          setIsLoading(false)
        }
      }
    }

    loadUser()

    return () => {
      isMounted = false
    }
  }, [])

  return {
    user,
    isLoading,
    error,
  }
}
