import type { Metadata } from "next"
import "./globals.css"
import { CurrentUserProvider } from "@/hooks/useCurrentUser"
import { NavigationProvider } from "@/hooks/useNavigation"
import { TourProvider } from "@/hooks/useTour"
import BackendConnectionNotice from "@/components/common/BackendConnectionNotice"

export const metadata: Metadata = {
  title: "D&D Academy",
  description: "Impara Dungeons & Dragons passo dopo passo",
  icons: {
    icon: { url: "/brand/dnd-academy.png", type: "image/png" },
    apple: { url: "/brand/dnd-academy.png", type: "image/png" },
  },
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body><CurrentUserProvider><NavigationProvider><TourProvider>{children}<BackendConnectionNotice /></TourProvider></NavigationProvider></CurrentUserProvider></body>
    </html>
  )
}
