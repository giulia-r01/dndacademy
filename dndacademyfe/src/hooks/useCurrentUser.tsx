"use client"

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { userService } from "@/services/user.service"
import { authService } from "@/services/auth.service"
import { ApiError } from "@/services/api"
import type { LoginRequest } from "@/types/auth"
import type { UserProfile } from "@/types/user"

type CurrentUserState = {
  user: UserProfile | null
  isLoading: boolean
  error: string
  updateUser: (user: UserProfile) => void
  refresh: () => Promise<void>
  logout: (reason?: "passwordChanged") => void
  loginHref: string
  login: (credentials: LoginRequest) => Promise<void>
}
const CurrentUserContext = createContext<CurrentUserState | null>(null)

export function CurrentUserProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const [user, setUser] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")
  const [loginHref, setLoginHref] = useState("/login")
  const generation = useRef(0)
  const pending = useRef<{ token: string; promise: Promise<UserProfile> } | null>(null)

  const logout = useCallback((reason?: "passwordChanged") => {
    generation.current++
    localStorage.removeItem("token")
    setUser(null)
    setError("")
    setIsLoading(false)
    pending.current = null
    setLoginHref(reason === "passwordChanged" ? "/login?passwordChanged=1" : "/login")
  }, [])

  const refresh = useCallback(() => {
    const requestGeneration = ++generation.current
    const token = localStorage.getItem("token")
    let profileRequest: Promise<UserProfile | null> = Promise.resolve(null)
    if (token) {
      if (!pending.current || pending.current.token !== token) {
        const promise = userService.getMe().finally(() => {
          if (pending.current?.promise === promise) pending.current = null
        })
        pending.current = { token, promise }
      }
      profileRequest = pending.current.promise
    }
    return profileRequest.then((profile) => {
      if (requestGeneration === generation.current) {
        setUser(profile)
        setError("")
        if (profile) setLoginHref("/login")
      }
    }).catch((err: unknown) => {
      if (requestGeneration !== generation.current) return
      if (err instanceof ApiError && err.status === 401) logout()
      else setError(err instanceof Error ? err.message : "Impossibile caricare il profilo.")
    }).finally(() => {
      if (requestGeneration === generation.current) setIsLoading(false)
    })
  }, [logout])

  useEffect(() => {
    const sequence = generation
    void refresh()
    return () => { sequence.current++ }
  }, [pathname, refresh])

  useEffect(() => {
    const storageChanged = (event: StorageEvent) => { if (event.key === "token") void refresh() }
    const sessionExpired = () => logout()
    window.addEventListener("session-expired", sessionExpired)
    window.addEventListener("storage", storageChanged)
    return () => {
      window.removeEventListener("session-expired", sessionExpired)
      window.removeEventListener("storage", storageChanged)
    }
  }, [logout, refresh])

  const updateUser = useCallback((profile: UserProfile) => {
    generation.current++
    pending.current = null
    setUser(profile)
    setError("")
    setIsLoading(false)
  }, [])

  const login = useCallback(async (credentials: LoginRequest) => {
    const attempt = ++generation.current
    pending.current = null
    setIsLoading(true)
    setError("")
    setUser(null)
    try {
      const response = await authService.login(credentials)
      if (attempt !== generation.current) throw new Error("Accesso interrotto. Riprova.")
      localStorage.setItem("token", response.token)
      const profile = await userService.getMe()
      if (attempt !== generation.current) throw new Error("Accesso interrotto. Riprova.")
      setUser(profile)
      setLoginHref("/login")
    } catch (err) {
      if (attempt === generation.current) {
        setError(err instanceof Error ? err.message : "Impossibile completare l’accesso.")
      }
      throw err
    } finally {
      if (attempt === generation.current) setIsLoading(false)
    }
  }, [])

  return <CurrentUserContext.Provider value={{ user, isLoading, error, updateUser, refresh, logout, loginHref, login }}>{children}</CurrentUserContext.Provider>
}

export function useCurrentUser() {
  const context = useContext(CurrentUserContext)
  if (!context) throw new Error("useCurrentUser richiede CurrentUserProvider")
  return context
}
