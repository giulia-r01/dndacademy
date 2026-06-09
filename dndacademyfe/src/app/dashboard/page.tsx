import { FiAward, FiBookOpen, FiTarget, FiZap } from "react-icons/fi"

import AchievementCard from "@/components/dashboard/AchievementCard"
import ProgressCourseCard from "@/components/dashboard/ProgressCourseCard"
import StatCard from "@/components/dashboard/StatCard"
import AppShell from "@/components/layout/AppShell"

export default function DashboardPage() {
  return (
    <AppShell>
      <section className="space-y-8">
        <div>
          <h2 className="text-3xl font-black text-[var(--text-main)]">
            Continua il tuo percorso
          </h2>

          <p className="mt-2 text-[var(--text-soft)]">
            Continua la tua avventura e completa le prossime lezioni.
          </p>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Lezioni completate"
            value="0"
            icon={<FiBookOpen size={22} aria-hidden="true" />}
          />

          <StatCard
            title="Quiz superati"
            value="0"
            icon={<FiTarget size={22} aria-hidden="true" />}
          />

          <StatCard
            title="Badge ottenuti"
            value="0"
            icon={<FiAward size={22} aria-hidden="true" />}
          />

          <StatCard
            title="Livello"
            value="BEGINNER"
            icon={<FiZap size={22} aria-hidden="true" />}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
          <div className="space-y-5">
            <h2 className="text-xl font-black text-[var(--text-main)]">
              Lezioni consigliate
            </h2>

            <ProgressCourseCard
              title="Fondamenti di D&D"
              level="BEGINNER"
              completedLessons={0}
              totalLessons={5}
              progress={0}
            />

            <ProgressCourseCard
              title="Creazione del personaggio"
              level="BEGINNER"
              completedLessons={0}
              totalLessons={4}
              progress={0}
            />

            <ProgressCourseCard
              title="Combattimento base"
              level="INTERMEDIATE"
              completedLessons={0}
              totalLessons={6}
              progress={0}
            />
          </div>

          <aside className="space-y-5">
            <h2 className="text-xl font-black text-[var(--text-main)]">
              Badge
            </h2>

            <AchievementCard
              title="Primo passo"
              description="Completa la tua prima lezione"
              unlocked={false}
              icon={<FiAward size={22} aria-hidden="true" />}
            />

            <AchievementCard
              title="Studente di D&D"
              description="Completa 2 lezioni e supera 2 quiz"
              unlocked={false}
              icon={<FiBookOpen size={22} aria-hidden="true" />}
            />

            <AchievementCard
              title="Avventuriero esperto"
              description="Raggiungi il livello intermedio"
              unlocked={false}
              icon={<FiZap size={22} aria-hidden="true" />}
            />
          </aside>
        </div>
      </section>
    </AppShell>
  )
}
