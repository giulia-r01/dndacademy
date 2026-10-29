import { FiHeart, FiShield, FiZap } from "react-icons/fi"
import AppCard from "@/components/common/AppCard"
import EntityPortrait from "@/components/common/EntityPortrait"
import type { Npc } from "@/types/npc"

const signed = (value: number) => `${value >= 0 ? "+" : ""}${value}`

export default function NpcCard({ npc }: { npc: Npc }) {
  return <AppCard className="transition hover:border-[var(--border-gold)]">
    <div className="flex flex-col gap-5 md:flex-row md:items-start">
      <EntityPortrait name={npc.name} imageUrl={npc.imageUrl} />
      <div className="min-w-0 flex-1">
        <h2 className="text-xl font-black text-[var(--text-main)]">{npc.name}</h2>
        <p className="mt-1 text-sm font-bold text-[var(--accent-soft)]">{npc.enemy ? "Nemico" : "Aiutante"} · NPC</p>
        {npc.healer && <p className="mt-3 text-sm font-bold text-emerald-300">Guaritore: cura d{npc.healingDie} +{npc.healingModifier}, {npc.healingUses} utilizzi per combattimento</p>}
        {npc.description && <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">{npc.description}</p>}
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-[var(--text-soft)]"><FiHeart aria-hidden="true" /> HP massimi</p>
            <p className="mt-2 text-lg font-black">{npc.maxHp}</p>
            <div className="mt-2 h-2 rounded-full bg-gradient-to-r from-[var(--primary)] to-[var(--accent)]" />
          </div>
          <div className="rounded-xl bg-[var(--surface-muted)] px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-bold text-[var(--text-soft)]"><FiShield aria-hidden="true" /> Classe Armatura</p>
            <p className="mt-2 text-lg font-black">{npc.armorClass}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-soft)]"><FiZap aria-hidden="true" /> Attacco</p>
            <p className="mt-2 font-bold">Tiro per colpire {signed(npc.attackModifier)}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Danno d{npc.damageDie} {signed(npc.damageModifier)}</p>
          </div>
          <div className="rounded-xl border border-[var(--border-teal-soft)] bg-[var(--surface-muted)] px-4 py-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent-soft)]">Iniziativa</p>
            <p className="mt-2 font-bold">Destrezza {npc.dexterity}</p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">Modificatore {signed(Math.floor((npc.dexterity - 10) / 2))}</p>
          </div>
        </div>
      </div>
    </div>
  </AppCard>
}
