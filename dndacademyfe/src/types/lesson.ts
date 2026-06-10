export interface Lesson {
  id: number
  title: string
  content: string
  orderIndex: number
  unlockedByDefault: boolean
}

export interface UserLessonProgress {
  lessonId: number
  title: string
  orderIndex: number
  unlocked: boolean
  completed: boolean
  completedAt: string | null
}
