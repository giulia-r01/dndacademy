import { FiBookOpen, FiCrosshair, FiUsers } from "react-icons/fi"
import AppButton from "@/components/common/AppButton"
import AppCard from "@/components/common/AppCard"
import EntityPortrait from "@/components/common/EntityPortrait"
import type { Encounter } from "@/types/encounter"
import type { Npc } from "@/types/npc"

type Props = { encounter: Encounter | null; npcs: Npc[]; onConfigure: () => void; onDelete: () => void }

export default function EncounterOverview({ encounter, npcs, onConfigure, onDelete }: Props) {
  const enemies = encounter?.npcs.filter(item => item.enemy).reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const allies = encounter?.npcs.filter(item => !item.enemy).reduce((sum, item) => sum + item.quantity, 0) ?? 0
  const availableEnemies = npcs.filter(item => item.enemy).length
  return <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div className="min-w-0 space-y-5">
      {encounter ? <>
        <AppCard>
          <p className="text-xs font-bold uppercase tracking-widest text-[var(--accent-soft)]">Incontro configurato</p>
          <h2 className="mt-3 break-words text-2xl font-black">{encounter.title}</h2>
          {encounter.description && <p className="mt-3 whitespace-pre-wrap break-words leading-7 text-[var(--text-soft)]">{encounter.description}</p>}
          <div className="mt-5 flex flex-wrap gap-3 text-sm font-bold"><span className="rounded-xl bg-[var(--surface-muted)] px-4 py-2">Nemici: {enemies}</span><span className="rounded-xl bg-[var(--surface-muted)] px-4 py-2">Alleati: {allies}</span></div>
        </AppCard>
        <section aria-label="Partecipanti dell'incontro" className="space-y-4">
          <h2 className="text-xl font-black">Partecipanti allo scontro</h2>
          <div className="grid gap-4 2xl:grid-cols-2">{encounter.npcs.map(item => {
            const npc = npcs.find(available => available.id === item.npcId)
            return <AppCard key={item.npcId} role="article" aria-label={item.npcName}>
              <div className="flex flex-col gap-4 sm:flex-row">
                <EntityPortrait name={item.npcName} imageUrl={npc?.imageUrl ?? null} className="h-[240px] w-full shrink-0 sm:h-[180px] sm:w-[120px]" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-soft)]">{item.enemy ? "Nemico" : "Alleato"} · {item.quantity} in campo</p>
                  <h3 className="mt-2 break-words text-lg font-black">{item.npcName}</h3>
                  {npc && <><p className="mt-3 text-sm font-bold">HP {npc.maxHp} · CA {npc.armorClass}</p><p className="mt-2 text-sm text-[var(--text-soft)]">Danno d{npc.damageDie} {npc.damageModifier >= 0 ? "+" : ""}{npc.damageModifier}</p>{npc.description && <p className="mt-3 break-words text-sm text-[var(--text-muted)]">{npc.description}</p>}</>}
                </div>
              </div>
            </AppCard>
          })}</div>
        </section>
        <details className="rounded-2xl border border-[var(--border-teal-soft)] p-4"><summary className="cursor-pointer text-sm font-bold text-[var(--text-muted)]">Eliminazione incontro</summary><p className="my-4 text-sm text-[var(--text-soft)]">Puoi eliminare solo incontri mai utilizzati in combattimento.</p><AppButton type="button" variant="danger" onClick={onDelete}>Elimina incontro</AppButton></details>
      </> : <AppCard className="overflow-hidden">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-[var(--border-gold)] bg-[var(--surface-muted)] text-[var(--accent)]"><FiCrosshair size={30} aria-hidden="true" /></div>
        <p className="mt-6 text-xs font-bold uppercase tracking-widest text-[var(--accent-soft)]">Il prossimo scontro prende forma</p>
        <h2 className="mt-3 text-2xl font-black sm:text-3xl">Prepara l’incontro del capitolo</h2>
        <p className="mt-4 max-w-2xl leading-7 text-[var(--text-soft)]">Dai un nome allo scontro, racconta cosa attende i giocatori e scegli chi scende in campo. Puoi usare i nemici e gli alleati della tua libreria NPC.</p>
        <ol className="mt-7 grid gap-3 md:grid-cols-3">{([
          [FiBookOpen, "Racconta la scena", "Titolo e descrizione introducono lo scontro."],
          [FiUsers, "Scegli i partecipanti", "Aggiungi almeno un nemico e gli eventuali alleati."],
          [FiCrosshair, "Definisci le forze", "Imposta quanti esemplari portare in campo."],
        ] as const).map(([Icon, title, text], index) => <li key={index} className="rounded-2xl bg-[var(--surface-muted)] p-4"><span className="text-sm font-bold text-[var(--accent)]">0{index + 1}</span><Icon className="my-3 text-[var(--text-soft)]" size={22} aria-hidden="true" /><h3 className="font-bold">{title}</h3><p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">{text}</p></li>)}</ol>
        <div className="mt-7 border-t border-[var(--border-teal-soft)] pt-5">
          {availableEnemies ? <AppButton type="button" onClick={onConfigure}>Crea incontro</AppButton> : <><p className="mb-4 text-sm text-[var(--text-soft)]">Per iniziare, aggiungi almeno un nemico alla libreria NPC.</p><AppButton href="/admin/npcs">Crea il primo nemico</AppButton></>}
        </div>
      </AppCard>}
    </div>
    <AppCard>
      <FiUsers size={26} className="text-[var(--accent)]" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-black">La tua libreria NPC</h2>
      <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">Prepara ritratti e statistiche di nemici e alleati, poi usali nei tuoi incontri.</p>
      <dl className="my-5 grid grid-cols-2 gap-3"><div className="rounded-xl bg-[var(--surface-muted)] p-3"><dt className="text-xs text-[var(--text-muted)]">Nemici</dt><dd className="mt-1 text-2xl font-black">{availableEnemies}</dd></div><div className="rounded-xl bg-[var(--surface-muted)] p-3"><dt className="text-xs text-[var(--text-muted)]">Alleati</dt><dd className="mt-1 text-2xl font-black">{npcs.length - availableEnemies}</dd></div></dl>
      <AppButton href="/admin/npcs" variant="secondary" className="w-full">Gestisci libreria NPC</AppButton>
    </AppCard>
  </div>
}
