import Link from "next/link"

export default function PublicFooter() {
  return (
    <footer className="mx-auto mt-10 w-full max-w-5xl border-t border-[var(--border-gold)]/20 px-4 pt-6 pb-4 text-sm text-[var(--text-muted)]">
      <nav aria-label="Informazioni sul servizio" className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3">
        <Link href="/" className="hover:text-[var(--accent-soft)]">D&D Academy</Link>
        <Link href="/privacy" className="hover:text-[var(--accent-soft)]">Informativa privacy</Link>
        <a href="mailto:dnd.academy.team@gmail.com" className="hover:text-[var(--accent-soft)]">Contatti</a>
      </nav>
    </footer>
  )
}
