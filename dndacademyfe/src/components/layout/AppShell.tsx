"use client"

import { useEffect, useState, type ReactNode } from "react"
import { useRouter } from "next/navigation"

import { useCurrentUser } from "@/hooks/useCurrentUser"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"
import AppButton from "@/components/common/AppButton"
import { usePathname } from "next/navigation"
import Breadcrumbs from "@/components/layout/Breadcrumbs"
import { defaultBreadcrumbs, type Breadcrumb } from "@/lib/navigation"
import { useTour } from "@/hooks/useTour"

type AppShellProps = {
  children: ReactNode
  breadcrumbs?: Breadcrumb[]
  activeHref?: string
}

export default function AppShell({ children, breadcrumbs, activeHref }: AppShellProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

  const { user, isLoading, error, refresh, logout, loginHref } = useCurrentUser()
  const { session } = useTour()
  const demoPage = pathname.startsWith("/tour/") && session !== null

  useEffect(() => {
    if (!isLoading && !user && !error) {
      router.replace(loginHref)
    }
  }, [error, isLoading, user, router, loginHref])

  function openSidebar() {
    setIsSidebarOpen(true)
  }

  function closeSidebar() {
    setIsSidebarOpen(false)
  }

  function handleLogout() {
    logout()
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

  if (error) return <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg-app)] p-6 text-[var(--text-main)]">
    <p role="alert">{error}</p><AppButton onClick={() => void refresh()}>Riprova</AppButton>
  </main>
  if (!user) return null

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)]">
      <div className="flex min-h-screen">
        <div className="hidden lg:block">
          <Sidebar user={demoPage ? { ...user, ...session.demo.profile, avatarUrl: null } : user} activeHref={activeHref} />
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
                user={demoPage ? { ...user, ...session.demo.profile, avatarUrl: null } : user}
                onClose={closeSidebar}
                showCloseButton
                activeHref={activeHref}
              />
            </div>
          </div>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar onMenuClick={openSidebar} user={demoPage ? { ...user, ...session.demo.profile, avatarUrl: null } : user} onLogout={handleLogout} />

          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8" style={demoPage ? { paddingBottom: "calc(var(--tour-coach-height, 16rem) + 4rem)" } : undefined}><Breadcrumbs items={breadcrumbs ?? defaultBreadcrumbs(pathname)} />{children}</main>
        </div>
      </div>
    </div>
  )
}
