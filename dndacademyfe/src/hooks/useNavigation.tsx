"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import { usePathname } from "next/navigation"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import type { Workspace } from "@/lib/navigation"

const NavigationContext = createContext<{ area: Workspace; rememberArea: (area: Workspace) => void } | null>(null)

export function NavigationProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { user } = useCurrentUser()
  const [selectedArea, rememberArea] = useState<Workspace | null>(null)
  const area: Workspace = user?.role !== "MASTER" ? "player" : pathname.startsWith("/admin") || pathname.startsWith("/tour/master/") ? "master" : pathname === "/profile" ? selectedArea ?? "master" : "player"
  return <NavigationContext.Provider value={{ area, rememberArea }}>{children}</NavigationContext.Provider>
}

export function useNavigation() {
  const context = useContext(NavigationContext)
  if (!context) throw new Error("useNavigation richiede NavigationProvider")
  return context
}
