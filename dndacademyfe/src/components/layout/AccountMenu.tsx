"use client"

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react"
import Link from "next/link"
import { FiChevronDown, FiLogOut, FiUser } from "react-icons/fi"
import UserAvatar from "@/components/common/UserAvatar"
import { useNavigation } from "@/hooks/useNavigation"
import { learningLevelLabels } from "@/lib/learning-level"
import type { UserProfile } from "@/types/user"

export default function AccountMenu({ user, onLogout }: { user: UserProfile | null; onLogout: () => void }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const initialFocus = useRef<"first" | "last">("first")
  const id = useId()
  const { area, rememberArea } = useNavigation()
  const username = user?.username ?? "Avventuriero"
  const level = learningLevelLabels[user?.learningLevel ?? "BEGINNER"]

  useEffect(() => {
    if (!open) return
    const items = menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]')
    const target = initialFocus.current === "last" ? items?.[items.length - 1] : items?.[0]
    target?.focus()
    function outsideClick(event: PointerEvent) {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false)
    }
    function escape(event: globalThis.KeyboardEvent) {
      if (event.key !== "Escape") return
      event.preventDefault()
      setOpen(false)
      triggerRef.current?.focus()
    }
    document.addEventListener("pointerdown", outsideClick)
    document.addEventListener("keydown", escape)
    return () => {
      document.removeEventListener("pointerdown", outsideClick)
      document.removeEventListener("keydown", escape)
    }
  }, [open])

  function navigateMenu(event: KeyboardEvent<HTMLDivElement>) {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])
    const index = items.indexOf(document.activeElement as HTMLElement)
    if (event.key === "Tab") {
      setOpen(false)
      triggerRef.current?.focus()
      return
    }
    let next: number
    if (event.key === "ArrowDown") next = (index + 1) % items.length
    else if (event.key === "ArrowUp") next = (index - 1 + items.length) % items.length
    else if (event.key === "Home") next = 0
    else if (event.key === "End") next = items.length - 1
    else return
    event.preventDefault()
    items[next]?.focus()
  }

  return <div ref={rootRef} className="relative shrink-0" onBlur={event => {
    if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) setOpen(false)
  }}>
    <button ref={triggerRef} id={`${id}-trigger`} type="button" aria-label="Apri menu account" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? `${id}-menu` : undefined}
      onClick={() => { initialFocus.current = "first"; setOpen(value => !value) }}
      onKeyDown={event => {
        if (event.key === "ArrowDown" || event.key === "ArrowUp") {
          event.preventDefault()
          initialFocus.current = event.key === "ArrowUp" ? "last" : "first"
          setOpen(true)
        }
      }}
      className="flex items-center gap-2 rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface)] px-3 py-2 text-left transition hover:border-[var(--border-gold)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--accent)]">
      <UserAvatar username={username} avatarUrl={user?.avatarUrl} />
      <span className="hidden min-w-0 text-sm sm:block"><span className="block max-w-40 truncate font-bold text-[var(--text-main)]">{username}</span><span className="block text-[var(--text-muted)]">{level}</span></span>
      <FiChevronDown size={16} aria-hidden="true" className={`text-[var(--text-soft)] transition-transform ${open ? "rotate-180" : ""}`} />
    </button>
    {open && <div id={`${id}-menu`} ref={menuRef} role="menu" aria-labelledby={`${id}-trigger`} onKeyDown={navigateMenu} className="absolute right-0 top-full z-40 mt-2 w-64 max-w-[calc(100vw-2rem)] rounded-2xl border border-[var(--border-teal-soft)] bg-[var(--surface)] p-2 shadow-[var(--shadow-card)]">
      <div role="presentation" className="mb-2 border-b border-[var(--border-teal-soft)] px-3 py-2 text-sm"><p className="truncate font-bold">{username}</p><p className="mt-1 text-[var(--text-muted)]">{level}</p></div>
      <Link role="menuitem" tabIndex={-1} href="/profile" onClick={() => { rememberArea(area); setOpen(false) }} className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[var(--text-main)] hover:bg-[var(--surface-soft)] focus:bg-[var(--surface-soft)] focus:outline-none"><FiUser size={18} aria-hidden="true" />Profilo</Link>
      <button role="menuitem" tabIndex={-1} type="button" onClick={() => { setOpen(false); onLogout() }} className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-bold text-[var(--danger)] hover:bg-[var(--surface-soft)] focus:bg-[var(--surface-soft)] focus:outline-none"><FiLogOut size={18} aria-hidden="true" />Esci</button>
    </div>}
  </div>
}
