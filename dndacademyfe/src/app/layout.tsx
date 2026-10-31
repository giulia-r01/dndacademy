import type { Metadata } from "next"
import "./globals.css"
import { CurrentUserProvider } from "@/hooks/useCurrentUser"

export const metadata: Metadata = {
  title: "D&D Academy",
  description: "Impara Dungeons & Dragons passo dopo passo",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body><CurrentUserProvider>{children}</CurrentUserProvider></body>
    </html>
  )
}
