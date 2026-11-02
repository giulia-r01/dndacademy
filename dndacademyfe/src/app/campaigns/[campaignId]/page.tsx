import { notFound } from "next/navigation"
import Content from "@/components/campaigns/CampaignDetailPage"
import { positiveId } from "@/lib/navigation"
export default async function Page({ params }: { params: Promise<{ campaignId: string }> }) {
  const route = await params
  const campaignId = positiveId(route.campaignId)
  if (!campaignId) notFound()
  return <Content key={`${campaignId}`} campaignId={campaignId} />
}
