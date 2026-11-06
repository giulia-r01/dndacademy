import CharacterInfo from "@/components/characters/CharacterInfo"
import type { CharacterStats } from "@/types/character"

const abilities: { key: keyof CharacterStats; label: string; explanation: string }[] = [
  { key: "strength", label: "Forza", explanation: "Misura la potenza fisica: sollevare pesi, spingere o arrampicarsi. Alcune armi usano questa caratteristica; controlla quella indicata nel box Arma." },
  { key: "dexterity", label: "Destrezza", explanation: "Misura agilità, riflessi e precisione: muoversi furtivamente, mantenere l’equilibrio o compiere gesti accurati. Alcune armi usano questa caratteristica." },
  { key: "constitution", label: "Costituzione", explanation: "Misura salute e resistenza fisica, per esempio contro fatica e condizioni difficili. Contribuisce ai punti vita nelle regole di D&D; qui gli HP della scheda sono già configurati dal Master." },
  { key: "intelligence", label: "Intelligenza", explanation: "Misura ragionamento, memoria e conoscenze: ricordare informazioni, studiare indizi o comprendere un argomento. Alcuni incantatori la usano per la magia." },
  { key: "wisdom", label: "Saggezza", explanation: "Misura attenzione e intuito: notare un pericolo, leggere le intenzioni altrui o orientarsi nella natura. Alcuni incantatori la usano per la magia." },
  { key: "charisma", label: "Carisma", explanation: "Misura presenza e capacità di influenzare gli altri: persuadere, esibirsi o intimidire. Alcuni incantatori la usano per la magia; non indica soltanto l’aspetto fisico." },
]

export default function CharacterAbilities({ stats }: { stats?: CharacterStats }) {
  return (
    <section aria-label="Caratteristiche" className="mt-4">
      <CharacterInfo label="Caratteristiche" explanation="I sei punteggi descrivono le capacità di base del personaggio. Il modificatore è il bonus o la penalità usato quando una prova richiede quella caratteristica: si calcola con (punteggio − 10) ÷ 2, arrotondato per difetto. Per esempio, 14 dà +2 e 9 dà −1. Un punteggio alto aiuta nelle situazioni pertinenti, ma non garantisce il successo. Confronta le capacità con le sfide descritte nella campagna e scegli anche in base a chi ti piacerebbe interpretare." />
      <dl className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {abilities.map(({ key, label, explanation }) => {
          const score = stats?.[key]
          const available = typeof score === "number" && Number.isFinite(score)
          const modifier = available ? Math.floor((score - 10) / 2) : null
          return (
            <div key={key} className="min-w-0 rounded-xl bg-[var(--surface-muted)] px-4 py-2">
              <dt><CharacterInfo label={label} explanation={explanation} /></dt>
              <dd className="pb-2">
                {available ? <><span className="text-lg font-black">{score}</span><span className="ml-3 text-sm text-[var(--text-muted)]">Modificatore {modifier! >= 0 ? "+" : ""}{modifier}</span></> : <span className="text-sm text-[var(--text-muted)]">Non disponibile</span>}
              </dd>
            </div>
          )
        })}
      </dl>
    </section>
  )
}
