import type { LearningLevel } from "@/types/user"

export const learningLevelLabels: Record<LearningLevel, string> = {
  BEGINNER: "Principiante",
  INTERMEDIATE: "Intermedio",
  ADVANCED: "Avanzato",
}

export const learningLevelStages: Record<LearningLevel, number> = {
  BEGINNER: 1,
  INTERMEDIATE: 2,
  ADVANCED: 3,
}
