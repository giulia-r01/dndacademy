import { notFound } from "next/navigation"
import Content from "@/components/lessons/LessonQuiz"
import { positiveId, contextFromQuery } from "@/lib/navigation"
export default async function Page({ params, searchParams }: { params: Promise<{ lessonId: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const route = await params, query = await searchParams
  const lessonId = positiveId(route.lessonId)
  if (!lessonId) notFound()
  const source = contextFromQuery(query)
  return <Content key={`${lessonId}-${source?.campaignId}-${source?.chapterId}`} lessonId={lessonId} source={source} />
}
