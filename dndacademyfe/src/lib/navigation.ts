import type { CampaignChapterPlayer } from "@/types/campaign-chapter"
import { tourPageTitle } from "@/lib/tour"

export type Workspace = "player" | "master"
export type Breadcrumb = { label: string; href?: string }
export type ChapterContext = { campaignId: number; chapterId: number }

export function positiveId(value: unknown): number | null {
  if (typeof value !== "string" || !/^[1-9]\d*$/.test(value)) return null
  const id = Number(value)
  return Number.isSafeInteger(id) ? id : null
}
export const campaignHref = (id: number) => `/campaigns/${id}`
export const chapterHref = (campaignId: number, chapterId: number) => `${campaignHref(campaignId)}/chapters/${chapterId}`
export const combatHref = (campaignId: number, chapterId: number) => `${chapterHref(campaignId, chapterId)}/combat`
export const encounterHref = (campaignId: number, chapterId: number) => `/admin/campaigns/${campaignId}/chapters/${chapterId}/encounter`
export function lessonHref(lessonId: number, context?: ChapterContext | null, quiz = false) {
  return `/lessons/${lessonId}${quiz ? "/quiz" : ""}${context ? `?campaignId=${context.campaignId}&chapterId=${context.chapterId}` : ""}`
}
export function contextFromQuery(query: { campaignId?: unknown; chapterId?: unknown }): ChapterContext | null {
  const campaignId = positiveId(query.campaignId), chapterId = positiveId(query.chapterId)
  return campaignId && chapterId ? { campaignId, chapterId } : null
}
export function chapterBreadcrumbs(chapter: CampaignChapterPlayer): Breadcrumb[] {
  return [{ label: "Campagne", href: "/campaigns" }, { label: chapter.campaignName, href: campaignHref(chapter.campaignId) }, { label: chapter.title, href: chapterHref(chapter.campaignId, chapter.chapterId) }]
}
export function chapterRequirementsMet(chapter: CampaignChapterPlayer) {
  return (!chapter.lessonId || chapter.lessonCompleted) && (!chapter.quizId || chapter.quizPassed) && (!chapter.hasCombat || chapter.combatWon)
}
export function nextChapterAction(chapter: CampaignChapterPlayer): { label: string; href: string } {
  const context = { campaignId: chapter.campaignId, chapterId: chapter.chapterId }
  if (chapter.completed) return { label: "Rivedi capitolo", href: chapterHref(chapter.campaignId, chapter.chapterId) }
  if (chapter.lessonId && !chapter.lessonCompleted) return { label: "Leggi la lezione", href: lessonHref(chapter.lessonId, context) }
  if (chapter.quizId && !chapter.quizPassed && (chapter.quizLessonId ?? chapter.lessonId)) return { label: "Affronta il quiz", href: lessonHref((chapter.quizLessonId ?? chapter.lessonId)!, context, true) }
  if (chapter.hasCombat && !chapter.combatWon) return { label: "Prepara il combattimento", href: combatHref(chapter.campaignId, chapter.chapterId) }
  return { label: "Completa il capitolo", href: chapterHref(chapter.campaignId, chapter.chapterId) }
}

const titles: Record<string, string> = {
  "/dashboard": "Il tuo percorso", "/campaigns": "Campagne", "/lessons": "Biblioteca lezioni",
  "/characters": "I tuoi personaggi", "/combat": "Storico combattimenti", "/achievements": "Badge", "/profile": "Il tuo profilo",
  "/admin": "Area Master", "/admin/campaigns": "Gestione campagne", "/admin/characters": "Personaggi delle campagne",
  "/admin/npcs": "Personaggi non giocanti", "/admin/lessons": "Gestione lezioni", "/admin/quizzes": "Gestione quiz",
  "/admin/badges": "Gestione badge", "/admin/users": "Utenti e statistiche", "/admin/encounters": "Gestione incontro",
}
export function pageTitle(pathname: string) {
  if (pathname.startsWith("/tour/")) return tourPageTitle(pathname.split("/").at(-1) ?? "")
  if (titles[pathname]) return titles[pathname]
  if (pathname.endsWith("/encounter")) return "Gestione incontro"
  if (pathname.endsWith("/combat")) return "Combattimento del capitolo"
  if (pathname.endsWith("/quiz")) return "Quiz della lezione"
  if (pathname.startsWith("/lessons/")) return "Lezione"
  if (pathname.startsWith("/admin/campaigns/")) return "Capitoli della campagna"
  if (/^\/campaigns\/\d+\/chapters\//.test(pathname)) return "Capitolo della campagna"
  if (pathname.startsWith("/campaigns/")) return "La tua campagna"
  return "D&D Academy"
}
export function defaultBreadcrumbs(pathname: string): Breadcrumb[] {
  if (pathname === "/admin") return [{ label: "Area Master" }]
  if (pathname.startsWith("/admin/")) return [{ label: "Area Master", href: "/admin" }, { label: pageTitle(pathname) }]
  if (pathname.startsWith("/campaigns/")) return [{ label: "Campagne", href: "/campaigns" }, { label: pageTitle(pathname) }]
  if (pathname.startsWith("/lessons/")) return [{ label: "Biblioteca lezioni", href: "/lessons" }, { label: pageTitle(pathname) }]
  return [{ label: pageTitle(pathname) }]
}
