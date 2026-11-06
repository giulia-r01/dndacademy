"use client"

import { useEffect, useLayoutEffect, useId, useRef, useState } from "react"
import { createPortal } from "react-dom"
import { FiX } from "react-icons/fi"
import type { GuidedStep } from "@/lib/tour"
import styles from "./spotlight.module.css"

type Geometry = { top: number; left: number; right: number; bottom: number; width: number; height: number; coachTop: number; coachLeft: number; docked: boolean }
const focusable = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

export default function TourSpotlight({ step, index, total, error, review, onBack, onForward, onExit, onContinue, onRetry }: { step: GuidedStep; index: number; total: number; error?: string; review: boolean; onBack: () => void; onForward: () => void; onExit: () => void; onContinue: () => void; onRetry: () => void }) {
  const [geometry, setGeometry] = useState<Geometry | null>(null)
  const [missing, setMissing] = useState(false)
  const coachRef = useRef<HTMLElement>(null), targetRef = useRef<HTMLElement | null>(null)
  const callbacks = useRef({ onExit })
  const id = useId()
  const positioned = geometry !== null
  useEffect(() => { callbacks.current = { onExit } }, [onExit])
  useLayoutEffect(() => {
    if (positioned && review) coachRef.current?.querySelector<HTMLElement>('button:not([disabled])')?.focus({ preventScroll: true })
  }, [positioned, review])

  useLayoutEffect(() => {
    const coach = coachRef.current
    if (!coach) return
    const previousSpace = document.documentElement.style.getPropertyValue("--tour-coach-height")
    const inert = new Map<HTMLElement, boolean>()
    let stopped = false, frame = 0, described: string | null = null
    function restoreInert() { for (const [element, value] of inert) element.inert = value; inert.clear() }
    function isolate(container: HTMLElement, target: HTMLElement | null) {
      for (const child of Array.from(container.children)) {
        if (!(child instanceof HTMLElement) || child === coach || child === target) continue
        if (child.contains(coach) || (target && child.contains(target))) isolate(child, target)
        else { if (!inert.has(child)) inert.set(child, child.inert); child.inert = true }
      }
    }
    function measure() {
      frame = 0
      if (stopped) return
      const height = coach!.offsetHeight, width = coach!.offsetWidth
      document.documentElement.style.setProperty("--tour-coach-height", `${height}px`)
      const target = Array.from(document.querySelectorAll<HTMLElement>(step.target)).find(element => element.getClientRects().length && getComputedStyle(element).visibility !== "hidden") ?? null
      if (target !== targetRef.current) {
        restoreInert()
        if (targetRef.current) {
          if (described === null) targetRef.current.removeAttribute("aria-describedby")
          else targetRef.current.setAttribute("aria-describedby", described)
        }
        targetRef.current = target
        if (target) {
          described = target.getAttribute("aria-describedby")
          target.setAttribute("aria-describedby", [described, `${id}-text`].filter(Boolean).join(" "))
          target.scrollIntoView({ block: target.offsetHeight > innerHeight / 3 ? "start" : "center", behavior: "instant" })
          const first = review ? coach!.querySelector<HTMLElement>('button:not([disabled])') : target.matches(focusable) ? target : target.querySelector<HTMLElement>(focusable)
          first?.focus({ preventScroll: true })
        }
        isolate(document.body, target)
        if (target && review) { inert.set(target, target.inert); target.inert = true }
      }
      if (!target) { isolate(document.body, null); setGeometry(null); return }
      const rect = target.getBoundingClientRect()
      let coachTop: number, coachLeft: number, docked = false
      if (innerWidth < 768) { coachTop = innerHeight - height - 12; coachLeft = (innerWidth - width) / 2; docked = true }
      else if (rect.bottom + height + 24 < innerHeight) { coachTop = rect.bottom + 16; coachLeft = Math.min(innerWidth - width - 12, Math.max(12, rect.left)) }
      else if (rect.top - height - 16 > 12) { coachTop = rect.top - height - 16; coachLeft = Math.min(innerWidth - width - 12, Math.max(12, rect.left)) }
      else if (rect.right + width + 24 < innerWidth) { coachLeft = rect.right + 16; coachTop = Math.max(12, Math.min(rect.top, innerHeight - height - 12)) }
      else { coachTop = innerHeight - height - 12; coachLeft = innerWidth - width - 12; docked = true }
      const top = Math.max(4, rect.top - 6), left = Math.max(4, rect.left - 6)
      const right = Math.min(innerWidth - 4, rect.right + 6)
      const bottom = Math.max(top, Math.min(rect.bottom + 6, docked ? coachTop - 10 : innerHeight - 4))
      setGeometry(previous => {
        const next = { top, left, right, bottom, width: right - left, height: bottom - top, coachTop, coachLeft, docked }
        return previous && JSON.stringify(previous) === JSON.stringify(next) ? previous : next
      })
    }
    function schedule() { if (!frame) frame = requestAnimationFrame(measure) }
    function allowed(node: EventTarget | null) { return node instanceof Node && (coach!.contains(node) || (!review && !!targetRef.current?.contains(node))) }
    function block(event: Event) { if (!allowed(event.target)) { event.preventDefault(); event.stopImmediatePropagation() } }
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); event.stopImmediatePropagation(); callbacks.current.onExit(); return }
      if (event.key !== "Tab") return
      const target = review ? null : targetRef.current
      const items = [...(target?.matches(focusable) ? [target] : []), ...Array.from(target?.querySelectorAll<HTMLElement>(focusable) ?? []), ...Array.from(coach!.querySelectorAll<HTMLElement>(focusable))].filter(element => element.getClientRects().length && !element.closest("[inert]"))
      if (!items.length) return
      const current = items.indexOf(document.activeElement as HTMLElement)
      event.preventDefault()
      items[(current + (event.shiftKey ? -1 : 1) + items.length) % items.length]?.focus()
    }
    function containFocus(event: FocusEvent) {
      if (allowed(event.target)) return
      const target = review ? null : targetRef.current
      const first = target?.matches(focusable) ? target : target?.querySelector<HTMLElement>(focusable)
      ;(first ?? (coach!.style.visibility !== "hidden" ? coach!.querySelector<HTMLElement>("button") : null))?.focus({ preventScroll: true })
    }
    const observer = new MutationObserver(schedule)
    observer.observe(document.body, { childList: true, subtree: true })
    const resize = new ResizeObserver(schedule)
    resize.observe(coach)
    document.addEventListener("click", block, true)
    document.addEventListener("pointerdown", block, true)
    document.addEventListener("keydown", keyboard, true)
    document.addEventListener("focusin", containFocus, true)
    window.addEventListener("resize", schedule)
    window.addEventListener("scroll", schedule, true)
    const timeout = window.setTimeout(() => { if (!targetRef.current) setMissing(true) }, 2500)
    // Position and focus the next target before the browser paints this step.
    measure()
    return () => {
      stopped = true
      cancelAnimationFrame(frame); clearTimeout(timeout); observer.disconnect(); resize.disconnect()
      document.removeEventListener("click", block, true); document.removeEventListener("pointerdown", block, true)
      document.removeEventListener("keydown", keyboard, true); document.removeEventListener("focusin", containFocus, true)
      window.removeEventListener("resize", schedule); window.removeEventListener("scroll", schedule, true)
      restoreInert()
      if (targetRef.current) {
        if (described === null) targetRef.current.removeAttribute("aria-describedby")
        else targetRef.current.setAttribute("aria-describedby", described)
      }
      targetRef.current = null
      document.documentElement.style.setProperty("--tour-coach-height", previousSpace)
    }
  }, [step, id, review])

  return createPortal(<>
    {geometry ? <div aria-hidden="true" data-tour-shade className={styles.shades}>
      <div style={{ left: 0, top: 0, width: "100%", height: geometry.top }} />
      <div style={{ left: 0, top: geometry.top, width: geometry.left, height: geometry.height }} />
      <div style={{ left: geometry.right, top: geometry.top, right: 0, height: geometry.height }} />
      <div style={{ left: 0, top: geometry.bottom, width: "100%", bottom: 0 }} />
      <span className={styles.outline} style={{ top: geometry.top, left: geometry.left, width: geometry.width, height: geometry.height }} />
    </div> : <div aria-hidden="true" className={styles.cover} />}
    <section data-tour-step={step.id} ref={coachRef} className={`custom-scrollbar ${styles.coach}`} aria-label="Guida del tour" style={geometry ? { top: geometry.coachTop, left: geometry.coachLeft } : { bottom: 12, right: 12, visibility: missing ? "visible" : "hidden" }}>
      <div className={styles.heading}><p>Passo {index + 1} di {total}</p><button type="button" className={styles.exit} onClick={onExit}><FiX size={17} aria-hidden="true" />Esci dal tour</button></div>
      <div className={`custom-scrollbar ${styles.content}`}>
        <h2>{step.title}</h2><p id={`${id}-text`} className={styles.description}>{step.text}</p>
        {error && <p role="alert" className="mt-3 text-sm font-bold text-[var(--text-danger)]">{error}</p>}
        {!geometry && <p role="status">{missing ? "Il comando non è disponibile. Riprova il passaggio oppure esci dal tour." : "Preparazione del passaggio…"}</p>}
        {geometry && <p className={styles.hint}>{review ? "Passaggio già completato: puoi rivederlo senza modificare i progressi. Premi Avanti per riprendere." : step.info ? "Leggi la spiegazione, poi prosegui." : "Completa l’azione evidenziata per proseguire."}</p>}
      </div>
      <div className={styles.actions}>
        <button type="button" className={styles.back} disabled={index === 0} onClick={onBack}>Indietro</button>
        {review ? <button type="button" className={styles.next} onClick={onForward}>Avanti</button>
          : missing && !geometry ? <button type="button" className={styles.next} onClick={onRetry}>Riprova passaggio</button>
          : geometry && step.info ? <button type="button" className={styles.next} onClick={onContinue}>{step.id === "finish" ? "Termina tour" : "Ho capito"}</button> : null}
      </div>
    </section>
  </>, document.body)
}
