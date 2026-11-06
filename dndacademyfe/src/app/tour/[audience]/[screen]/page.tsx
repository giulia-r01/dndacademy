import { notFound } from "next/navigation"
import GuidedTourPage from "@/components/tour/GuidedTourPage"
import { tourSteps } from "@/lib/tour"

export default async function TourPage({ params }: { params: Promise<{ audience: string; screen: string }> }) {
  const { audience, screen } = await params
  if (audience !== "player" && audience !== "master") notFound()
  const step = tourSteps(audience).find(item => item.screen === screen)
  if (!step) notFound()
  return <GuidedTourPage audience={audience} screen={step.screen} />
}
