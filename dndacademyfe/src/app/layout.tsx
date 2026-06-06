import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "D&D Academy",
  description: "Impara Dungeons & Dragons passo dopo passo",
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="it">
      <body>{children}</body>
    </html>
  )
}
