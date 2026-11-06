"use client"

import { type Dispatch, type SetStateAction } from "react"
import AppCard from "@/components/common/AppCard"
import PlayerDemo from "./PlayerDemo"
import MasterDemo from "./MasterDemo"
import type { TourDemo } from "@/lib/tour-demo"
import type { TourAudience, TourScreen } from "@/lib/tour"

export default function TourDemoScreen({ audience, screen, stepId, demo, setDemo, navigate, act, notify }: { audience: TourAudience; screen: TourScreen; stepId: string; demo: TourDemo; setDemo: Dispatch<SetStateAction<TourDemo>>; navigate: (screen: TourScreen) => void; act: (action: string) => void; notify: (message: string, error?: boolean) => void }) {
  const props = { screen, stepId, demo, setDemo, notify, navigate, act }
  const masterScreen = audience === "master" && !["profile", "finish"].includes(screen)
  return <div data-tour-screen={screen} className="mx-auto max-w-4xl" onSubmitCapture={event => event.preventDefault()}>
    {screen === "finish" ? <AppCard data-tour-action="finish" className="space-y-4 border-[var(--border-gold)]"><h2 className="text-2xl font-black">Percorso completato</h2><p>Hai provato tutte le azioni richieste. La campagna, i personaggi e i progressi di questa dimostrazione non sono stati salvati nel tuo account.</p></AppCard>
      : masterScreen ? <MasterDemo {...props} /> : <PlayerDemo {...props} />}
  </div>
}

