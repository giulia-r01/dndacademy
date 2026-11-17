"use client"

import { useId, useLayoutEffect, useRef } from "react"
import { createPortal } from "react-dom"
import { FiArrowLeft, FiArrowRight, FiCompass, FiMapPin, FiX } from "react-icons/fi"
import { mobileTourSteps } from "@/lib/mobile-tour"
import type { TourAudience } from "@/lib/tour"
import styles from "./mobile-tour.module.css"

type Props = {
  audience: TourAudience
  index: number
  onBack: () => void
  onNext: () => void
  onExit: () => void
}

export default function MobileTour({ audience, index, onBack, onNext, onExit }: Props) {
  const steps = mobileTourSteps(audience)
  const step = steps[index]
  const id = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLHeadingElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onExit)
  useLayoutEffect(() => { closeRef.current = onExit }, [onExit])

  useLayoutEffect(() => {
    const root = rootRef.current
    if (!root) return
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    const inert = new Map<HTMLElement, boolean>()
    for (const child of Array.from(document.body.children)) {
      if (!(child instanceof HTMLElement) || child === root) continue
      inert.set(child, child.inert)
      child.inert = true
    }
    document.body.style.overflow = "hidden"
    const buttons = () => Array.from(root.querySelectorAll<HTMLButtonElement>('button:not([disabled])'))
    function keyboard(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopImmediatePropagation()
        closeRef.current()
      }
      if (event.key !== "Tab") return
      const items = buttons()
      const current = items.indexOf(document.activeElement as HTMLButtonElement)
      event.preventDefault()
      items[(current + (event.shiftKey ? -1 : 1) + items.length) % items.length]?.focus({ preventScroll: true })
    }
    function focus(event: FocusEvent) {
      if (event.target instanceof Node && !root!.contains(event.target)) titleRef.current?.focus({ preventScroll: true })
    }
    document.addEventListener("keydown", keyboard, true)
    document.addEventListener("focusin", focus, true)
    return () => {
      document.removeEventListener("keydown", keyboard, true)
      document.removeEventListener("focusin", focus, true)
      document.body.style.overflow = previousOverflow
      for (const [element, value] of inert) element.inert = value
      if (opener?.isConnected) opener.focus({ preventScroll: true })
    }
  }, [])

  useLayoutEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: "instant" })
    titleRef.current?.focus({ preventScroll: true })
  }, [index])

  return createPortal(
    <div ref={rootRef} className={styles.overlay}>
      <section role="dialog" aria-modal="true" aria-labelledby={`${id}-title`} aria-describedby={`${id}-text`} data-tour-mobile={step.id} className={styles.panel}>
        <header className={styles.header}>
          <p><FiCompass aria-hidden="true" /> Tour {audience === "master" ? "Master" : "Player"}</p>
          <button type="button" onClick={onExit} className={styles.exit}><FiX aria-hidden="true" /> Esci dal tour</button>
        </header>
        <div className={styles.progress}>
          <p>Passo {index + 1} di {steps.length}</p>
          <progress value={index + 1} max={steps.length} aria-label="Avanzamento del tour" />
        </div>
        <div ref={contentRef} className={`custom-scrollbar ${styles.content}`}>
          <h2 id={`${id}-title`} ref={titleRef} tabIndex={-1}>{step.title}</h2>
          <p id={`${id}-text`}>{step.text}</p>
          <div className={styles.location}><FiMapPin aria-hidden="true" /><span>{step.location}</span></div>
          <div className={styles.example}>
            <p className={styles.caption}>Esempio · Nessuna modifica ai dati reali</p>
            <h3>{step.example.title}</h3>
            <ul>{step.example.lines.map(line => <li key={line}>{line}</li>)}</ul>
          </div>
          <p className={styles.action}><strong>Nell’app:</strong> {step.action}</p>
        </div>
        <footer className={styles.footer}>
          <button type="button" disabled={index === 0} onClick={onBack} className={styles.back}><FiArrowLeft aria-hidden="true" /> Indietro</button>
          <button type="button" onClick={onNext} className={styles.next}>{index === steps.length - 1 ? "Termina tour" : "Avanti"}<FiArrowRight aria-hidden="true" /></button>
        </footer>
      </section>
    </div>, document.body,
  )
}
