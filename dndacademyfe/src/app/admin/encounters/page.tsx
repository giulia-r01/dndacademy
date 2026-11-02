import { redirect, notFound } from "next/navigation"
import EncounterPage from "@/components/admin/encounters/EncounterPage"
import { encounterHref, positiveId } from "@/lib/navigation"
export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const query = await searchParams
  if (query.campaignId !== undefined || query.chapterId !== undefined) {
    const campaignId = positiveId(query.campaignId), chapterId = positiveId(query.chapterId)
    if (!campaignId || !chapterId) notFound()
    redirect(encounterHref(campaignId, chapterId))
  }
  return <EncounterPage campaignId={null} chapterId={null} />
}
