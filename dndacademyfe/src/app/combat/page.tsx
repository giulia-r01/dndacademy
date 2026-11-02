import { redirect, notFound } from "next/navigation"
import AppShell from "@/components/layout/AppShell"
import CombatHistory from "@/components/combat/CombatHistory"
import { combatHref, positiveId } from "@/lib/navigation"

export default async function CombatHistoryPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  if (query.campaignId !== undefined || query.chapterId !== undefined) {
    const campaignId = positiveId(query.campaignId), chapterId = positiveId(query.chapterId)
    if (!campaignId || !chapterId) notFound()
    const combatId = positiveId(query.combatId)
    redirect(combatHref(campaignId, chapterId) + (combatId ? `?combatId=${combatId}` : ""))
  }
  return <AppShell><section className="space-y-6"><div><h2 className="text-3xl font-black">Storico combattimenti</h2><p className="mt-2 text-[var(--text-soft)]">Rivedi i risultati delle battaglie e riprendi gli scontri ancora aperti.</p></div><CombatHistory /></section></AppShell>
}
