import { notFound } from "next/navigation"
import CharactersPage from "@/components/characters/CharactersPage"
import { positiveId } from "@/lib/navigation"
export default async function Page({ searchParams }: { searchParams: Promise<{ campaignId?: string }> }) {
  const query = await searchParams
  const initialCampaignId = positiveId(query.campaignId)
  if (query.campaignId !== undefined && !initialCampaignId) notFound()
  return <CharactersPage key={initialCampaignId ?? "all"} initialCampaignId={initialCampaignId} />
}
