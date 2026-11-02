"use client"

import { useEffect, useState } from "react"
import { FiAward, FiBookOpen, FiTarget, FiZap } from "react-icons/fi"
import AppShell from "@/components/layout/AppShell"
import AppCard from "@/components/common/AppCard"
import AppButton from "@/components/common/AppButton"
import StatCard from "@/components/dashboard/StatCard"
import CampaignResumeCard from "@/components/campaigns/CampaignResumeCard"
import { useCurrentUser } from "@/hooks/useCurrentUser"
import { campaignService } from "@/services/campaign.service"
import { combatService } from "@/services/combat.service"
import { badgeService } from "@/services/badge.service"
import { lessonService } from "@/services/lesson.service"
import { quizService } from "@/services/quiz.service"
import { combatHref } from "@/lib/navigation"
import { learningLevelLabels } from "@/lib/learning-level"
import type { CampaignProgress } from "@/types/campaign-progress"
import type { CombatHistoryEntry } from "@/types/combat"
import type { UserLessonProgress } from "@/types/lesson"
import type { UserQuizResult } from "@/types/quiz"
import type { Badge } from "@/types/badge"

export default function DashboardPage() {
  const { user } = useCurrentUser()
  const [campaigns, setCampaigns] = useState<CampaignProgress[]>([])
  const [battle, setBattle] = useState<CombatHistoryEntry | null>(null)
  const [lessons, setLessons] = useState<UserLessonProgress[]>([])
  const [quizzes, setQuizzes] = useState<UserQuizResult[]>([])
  const [badges, setBadges] = useState<Badge[]>([])
  const [loading, setLoading] = useState(true)
  const [campaignError, setCampaignError] = useState("")
  const [summaryError, setSummaryError] = useState("")
  const [historyError, setHistoryError] = useState("")
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    if (!user?.id) return
    let active = true
    Promise.allSettled([campaignService.getMyProgress(), combatService.getHistory(), lessonService.getMyProgress(), quizService.getMyResults(), badgeService.getMine()]).then(([campaignResult, historyResult, lessonResult, quizResult, badgeResult]) => {
      if (!active) return
      if (campaignResult.status === "fulfilled") setCampaigns(campaignResult.value)
      else setCampaignError("Non riesco a recuperare le campagne. Riprova per vedere il tuo percorso.")
      if (historyResult.status === "fulfilled") setBattle(historyResult.value.items?.find(item => !item.completed && item.campaignId !== null && item.chapterId !== null) ?? null)
      else setHistoryError("I combattimenti da riprendere non sono momentaneamente disponibili.")
      if (lessonResult.status === "fulfilled") setLessons(lessonResult.value)
      if (quizResult.status === "fulfilled") setQuizzes(quizResult.value)
      if (badgeResult.status === "fulfilled") setBadges(badgeResult.value)
      if ([lessonResult, quizResult, badgeResult].some(result => result.status === "rejected")) setSummaryError("Alcune statistiche non sono momentaneamente disponibili.")
      setLoading(false)
    })
    return () => { active = false }
  }, [user?.id, attempt])
  const current = campaigns.filter(campaign => campaign.joined && campaign.unlocked && !campaign.completed)
  const available = campaigns.filter(campaign => campaign.unlocked && !campaign.joined && !campaign.completed)
  const completed = campaigns.filter(campaign => campaign.completed)
  const retry = () => { setCampaignError(""); setSummaryError(""); setHistoryError(""); setLoading(true); setAttempt(value => value + 1) }
  return <AppShell><section className="space-y-7">
    <div><h2 className="text-3xl font-black">Il tuo percorso</h2><p className="mt-2 text-[var(--text-soft)]">Impara giocando: segui una campagna, affronta i capitoli e sblocca i tuoi traguardi.</p></div>
    {loading ? <AppCard><p role="status">Caricamento del tuo percorso...</p></AppCard> : <>
      {campaignError ? <AppCard><p role="alert" className="text-[var(--danger)]">{campaignError}</p><AppButton className="mt-4" onClick={retry}>Riprova</AppButton></AppCard> : <>
        {battle?.campaignId && battle.chapterId && <AppCard className="space-y-3 border-[var(--border-gold)]"><p className="text-sm font-bold text-[var(--accent-soft)]">Hai un combattimento ancora aperto</p><h3 className="text-xl font-black">{battle.encounterTitle}</h3><p className="text-sm text-[var(--text-soft)]">{battle.campaignName} · {battle.chapterTitle}</p><AppButton href={`${combatHref(battle.campaignId, battle.chapterId)}?combatId=${battle.combatId}`}>Riprendi il combattimento</AppButton></AppCard>}
        {current.length > 0 ? <section aria-label="Campagne da continuare" className="space-y-4"><h3 className="text-xl font-black">{current.length === 1 ? "Continua la tua avventura" : "Scegli quale avventura continuare"}</h3><div className="grid gap-4 xl:grid-cols-2">{current.map(campaign => <CampaignResumeCard key={campaign.campaignId} campaign={campaign} />)}</div></section> : <AppCard className="space-y-4">
          <h3 className="text-2xl font-black">{available.length ? completed.length ? "La prossima avventura ti aspetta" : "Inizia la tua prima avventura" : completed.length ? "Hai completato le avventure disponibili" : "Le tue avventure iniziano qui"}</h3>
          <p className="max-w-2xl text-[var(--text-soft)]">{available.length ? "Scegli una campagna disponibile: ogni capitolo ti guiderà tra storia, lezioni, quiz e combattimenti." : completed.length ? "Rivedi i capitoli completati o consulta la biblioteca per continuare a esercitarti." : "Al momento non ci sono nuove campagne sbloccate da iniziare. Puoi consultare il catalogo o esplorare la biblioteca."}</p>
          <div className="flex flex-wrap gap-3"><AppButton href="/campaigns">{available.length ? "Scegli la tua avventura" : "Esplora le campagne"}</AppButton><AppButton href="/lessons" variant="secondary">Biblioteca lezioni</AppButton></div>
        </AppCard>}
      </>}
      {historyError && <AppCard><p role="alert" className="text-sm text-[var(--text-muted)]">{historyError}</p><AppButton className="mt-3" variant="secondary" href="/combat">Apri lo storico</AppButton></AppCard>}
      <section className="space-y-4"><h3 className="text-xl font-black">I tuoi progressi</h3>
        {summaryError ? <AppCard><p role="alert">{summaryError}</p><AppButton className="mt-3" variant="secondary" onClick={retry}>Aggiorna progressi</AppButton></AppCard> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard title="Lezioni completate" value={String(lessons.filter(lesson => lesson.completed).length)} icon={<FiBookOpen size={22} aria-hidden="true" />} />
          <StatCard title="Quiz superati" value={String(new Set(quizzes.filter(quiz => quiz.passed).map(quiz => quiz.quizId)).size)} icon={<FiTarget size={22} aria-hidden="true" />} />
          <StatCard title="Badge ottenuti" value={String(badges.length)} icon={<FiAward size={22} aria-hidden="true" />} />
          <StatCard title="Livello" value={learningLevelLabels[user?.learningLevel ?? "BEGINNER"]} icon={<FiZap size={22} aria-hidden="true" />} />
        </div>}
      </section>
      <div className="flex flex-wrap gap-3"><AppButton href="/campaigns" variant="secondary">Tutte le campagne</AppButton><AppButton href="/achievements" variant="secondary">Scopri i tuoi badge</AppButton><AppButton href="/characters" variant="secondary">I tuoi personaggi</AppButton></div>
    </>}
  </section></AppShell>
}
