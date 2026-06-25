export interface QuizSummary {
  id: number
  title: string
}

export interface ChapterSummary {
  id: number
  title: string
}

export interface Lesson {
  id: number
  title: string
  content: string
  orderIndex: number
  unlockedByDefault: boolean
  quiz: QuizSummary | null
  chapters: ChapterSummary[]
}

export interface UserLessonProgress {
  lessonId: number
  title: string
  orderIndex: number
  unlocked: boolean
  completed: boolean
  completedAt: string | null
}

export interface CreateLessonRequest {
  title: string
  content: string
  orderIndex: number
  unlockedByDefault: boolean
}

export interface UpdateLessonRequest {
  title: string
  content: string
  orderIndex: number
  unlockedByDefault: boolean
}
