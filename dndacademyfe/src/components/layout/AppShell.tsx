"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { useCurrentUser } from "@/hooks/useCurrentUser"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"

type AppShellProps = {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { user, isLoading, error } = useCurrentUser()

  useEffect(() => {
    if (!isLoading && error) {
      localStorage.removeItem("token")
      router.push("/login")
    }
  }, [error, isLoading, router])

  function openSidebar() {
    setIsSidebarOpen(true)
  }

  function closeSidebar() {
    setIsSidebarOpen(false)
  }

  function handleLogout() {
    localStorage.removeItem("token")
    router.push("/login")
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[var(--bg-app)] px-6 text-[var(--text-main)]">
        <p className="text-sm font-bold text-[var(--text-soft)]">
          Caricamento area personale...
        </p>
      </main>
    )
  }

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)]">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar user={user} onLogout={handleLogout} />
        </div>

        {isSidebarOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Chiudi menu di navigazione"
              className="absolute inset-0 bg-black/60"
              onClick={closeSidebar}
            />

            <div className="relative z-10 h-full">
              <Sidebar
                user={user}
                onClose={closeSidebar}
                onLogout={handleLogout}
                showCloseButton
              />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={openSidebar} user={user} />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
