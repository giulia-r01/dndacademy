"use client"

import AppShell from "@/components/layout/AppShell"
import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import { useTour } from "@/hooks/useTour"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import TourDemoScreen from "./TourDemoScreen"
import { tourSteps, tourPageTitle, tourActiveHref, type TourAudience, type TourScreen } from "@/lib/tour"

export default function GuidedTourPage({ audience, screen }: { audience: TourAudience; screen: TourScreen }) {
  const { session, startTour, exitTour, setDemo, navigate, act, notify } = useTour()
  const { user } = useCurrentUser()
  const allowed = audience !== "master" || user?.role === "MASTER"
  const current = session ? tourSteps(session.audience)[session.index] : null
  return <AppShell activeHref={tourActiveHref(audience, screen)} breadcrumbs={[{ label: "Tour dimostrativo" }, { label: audience === "master" ? "Area Master" : "Area Player" }, { label: tourPageTitle(screen) }]}>
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[var(--border-gold)]/50 bg-[var(--surface)] px-4 py-3 text-sm">
      <p><strong>Modalità dimostrativa</strong> · Nessuna modifica ai dati reali</p>
      {session && <button type="button" onClick={() => exitTour()} className="text-[var(--accent-soft)] underline">Esci dal tour</button>}
    </div>
    {!allowed ? <AppCard><p>Questo percorso è riservato ai Master.</p><AppButton href="/dashboard">Torna al tuo percorso</AppButton></AppCard>
      : !session ? <AppCard className="space-y-4"><h2 className="text-2xl font-black">La prova non è attiva</h2><p>I contenuti dimostrativi vengono eliminati alla chiusura o al ricaricamento. Puoi ricominciare dall’inizio.</p><AppButton onClick={() => startTour(audience)}>Inizia il tour {audience === "master" ? "Master" : "Player"}</AppButton><AppButton href={user?.role === "MASTER" ? "/admin" : "/dashboard"} variant="secondary">Torna all’app</AppButton></AppCard>
      : session.audience !== audience || current?.screen !== screen ? <p role="status">Preparazione del passaggio…</p>
      : <TourDemoScreen key={`${session.serial}:${screen}`} stepId={current.id} audience={audience} screen={screen} demo={session.index < session.furthest ? session.snapshots[session.index] : session.demo} setDemo={setDemo} navigate={navigate} act={act} notify={notify} />}
  </AppShell>
}
