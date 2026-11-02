import { notFound } from "next/navigation"
import ChapterCombat from "@/components/combat/ChapterCombat"
import { positiveId } from "@/lib/navigation"
export default async function Page({ params, searchParams }: { params: Promise<{ campaignId: string; chapterId: string }>; searchParams: Promise<{ combatId?: string }> }) {
  const route = await params, query = await searchParams
  const campaignId = positiveId(route.campaignId), chapterId = positiveId(route.chapterId)
  if (!campaignId || !chapterId || (query.combatId !== undefined && !positiveId(query.combatId))) notFound()
  const resumeCombatId = positiveId(query.combatId)
  return <ChapterCombat key={`${campaignId}-${chapterId}-${resumeCombatId}`} campaignId={campaignId} chapterId={chapterId} resumeCombatId={resumeCombatId} />
}
