"use client"

import { createContext, useContext, useEffect, useReducer, useRef, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { usePathname, useRouter } from "next/navigation"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import TourSpotlight from "@/components/tour/TourSpotlight"
import { createTourDemo, type TourDemo } from "@/lib/tour-demo"
import { hasSeenTour, isAppPath, saveTourResult, tourHref, tourSteps, tourStorageKey, type TourAudience, type TourScreen } from "@/lib/tour"
import type { UserProfile } from "@/types/user"

type Session = { audience: TourAudience; index: number; furthest: number; snapshots: TourDemo[]; demo: TourDemo; origin: string; serial: number; error?: string }
type Action = { type: "start"; session: Session } | { type: "close" } | { type: "back" } | { type: "forward" } | { type: "data"; update: SetStateAction<TourDemo> } | { type: "event"; name: string } | { type: "navigate"; screen: TourScreen } | { type: "info" } | { type: "feedback"; stepId: string; message: string }
function advance(session: Session, demo = session.demo): Session {
  const snapshots = [...session.snapshots]
  snapshots[session.index] = session.demo
  snapshots[session.index + 1] = demo
  return { ...session, demo, snapshots, index: session.index + 1, furthest: session.index + 1, error: undefined }
}
function reducer(session: Session | null, action: Action): Session | null {
  if (action.type === "start") return action.session
  if (action.type === "close") return null
  if (!session) return null
  if (action.type === "back") return { ...session, index: Math.max(0, session.index - 1), error: undefined }
  if (action.type === "forward") return { ...session, index: Math.min(session.furthest, session.index + 1), error: undefined }
  // Past steps are read-only snapshots; reviewing them cannot replay or skip an action.
  if (session.index < session.furthest) return session
  const step = tourSteps(session.audience)[session.index]
  if (action.type === "feedback") return step.id === action.stepId ? { ...session, error: action.message } : session
  if (action.type === "data") {
    const demo = typeof action.update === "function" ? action.update(session.demo) : action.update
    if (step.complete?.(demo)) return advance(session, demo)
    const snapshots = [...session.snapshots]
    snapshots[session.index] = demo
    return { ...session, demo, snapshots, error: undefined }
  }
  const allowed = action.type === "event" ? step.event === action.name : action.type === "navigate" ? step.navigate === action.screen : step.info
  return allowed && session.index < tourSteps(session.audience).length - 1 ? advance(session) : session
}
type TourContextValue = {
  session: Session | null
  startTour: (audience?: TourAudience, opener?: HTMLElement | null) => void
  exitTour: (status?: "dismissed" | "completed") => void
  setDemo: Dispatch<SetStateAction<TourDemo>>
  navigate: (screen: TourScreen) => void
  act: (name: string) => void
  notify: (message: string, error?: boolean) => void
}
const TourContext = createContext<TourContextValue | null>(null)

export function TourProvider({ children }: { children: ReactNode }) {
  const { user, isLoading, error } = useCurrentUser()
  return <TourSessionProvider key={`${user?.id ?? "anonymous"}:${user?.role ?? "none"}`} user={user} ready={!isLoading && !error}>{children}</TourSessionProvider>
}
function TourSessionProvider({ children, user, ready }: { children: ReactNode; user: UserProfile | null; ready: boolean }) {
  const pathname = usePathname(), router = useRouter()
  const [session, dispatch] = useReducer(reducer, null)
  const attempted = useRef(false), serial = useRef(0)
  const originFocus = useRef<HTMLElement | null>(null)
  function startTour(requested?: TourAudience, opener?: HTMLElement | null) {
    if (!user || !ready || !isAppPath(pathname)) return
    const audience = requested ?? (user.role === "MASTER" ? "master" : "player")
    if (audience === "master" && user.role !== "MASTER") return
    attempted.current = true
    originFocus.current = opener ?? null
    const origin = pathname.startsWith("/tour/") ? user.role === "MASTER" ? "/admin" : "/dashboard" : window.location.pathname + window.location.search + window.location.hash
    const demo = createTourDemo(audience)
    dispatch({ type: "start", session: { audience, index: 0, furthest: 0, snapshots: [demo], demo, origin, serial: ++serial.current } })
    router.push(tourHref(audience, tourSteps(audience)[0].screen))
  }
  function exitTour(status: "dismissed" | "completed" = "dismissed") {
    if (!session) return
    if (user) { try { saveTourResult(localStorage, tourStorageKey(user, session.audience), status) } catch { /* Storage can be blocked. */ } }
    dispatch({ type: "close" })
    router.replace(session.origin)
    requestAnimationFrame(() => (originFocus.current?.isConnected ? originFocus.current : document.querySelector<HTMLElement>('[aria-label="Apri menu account"]'))?.focus({ preventScroll: true }))
  }
  useEffect(() => {
    if (!user || !ready || !isAppPath(pathname) || pathname.startsWith("/tour/") || attempted.current) return
    const audience = user.role === "MASTER" ? "master" : "player"
    try { if (hasSeenTour(localStorage, tourStorageKey(user, audience))) return } catch { /* Still allow a tour. */ }
    const frame = requestAnimationFrame(() => {
      attempted.current = true
      const origin = window.location.pathname + window.location.search + window.location.hash
      const demo = createTourDemo(audience)
      dispatch({ type: "start", session: { audience, index: 0, furthest: 0, snapshots: [demo], demo, origin, serial: ++serial.current } })
      router.push(tourHref(audience, tourSteps(audience)[0].screen))
    })
    return () => cancelAnimationFrame(frame)
  }, [pathname, user, ready, router])
  useEffect(() => {
    if (!session) return
    const expected = tourHref(session.audience, tourSteps(session.audience)[session.index].screen)
    if (pathname.startsWith("/tour/") && pathname !== expected) router.replace(expected)
  }, [session, pathname, router])
  useEffect(() => {
    if (!session) return
    const onBack = () => {
      if (user) { try { saveTourResult(localStorage, tourStorageKey(user, session.audience), "dismissed") } catch { /* No persistence. */ } }
      dispatch({ type: "close" })
    }
    window.addEventListener("popstate", onBack)
    return () => window.removeEventListener("popstate", onBack)
  }, [session, user])
  const step = session ? tourSteps(session.audience)[session.index] : null
  return <TourContext.Provider value={{ session, startTour, exitTour, setDemo: update => dispatch({ type: "data", update }), navigate: screen => dispatch({ type: "navigate", screen }), act: name => dispatch({ type: "event", name }), notify: (message, error) => { if (error && step) dispatch({ type: "feedback", stepId: step.id, message }) } }}>
    {children}
    {session && ready && step && pathname === tourHref(session.audience, step.screen) && <TourSpotlight key={`${session.serial}:${step.id}`} step={step} error={session.error} index={session.index} review={session.index < session.furthest} total={tourSteps(session.audience).length} onBack={() => dispatch({ type: "back" })} onForward={() => dispatch({ type: "forward" })} onExit={() => exitTour()} onContinue={() => step.id === "finish" ? exitTour("completed") : dispatch({ type: "info" })} onRetry={() => router.refresh()} />}
  </TourContext.Provider>
}
export function useTour() { const context = useContext(TourContext); if (!context) throw new Error("useTour richiede TourProvider"); return context }

