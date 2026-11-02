import { notFound } from "next/navigation"
import EncounterPage from "@/components/admin/encounters/EncounterPage"
import { positiveId } from "@/lib/navigation"
export default async function Page({ params }: { params: Promise<{ campaignId: string; chapterId: string }> }) {
  const route = await params
  const campaignId = positiveId(route.campaignId), chapterId = positiveId(route.chapterId)
  if (!campaignId || !chapterId) notFound()
  return <EncounterPage key={`${campaignId}-${chapterId}`} campaignId={campaignId} chapterId={chapterId} />
}
