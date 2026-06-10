export interface Quiz {
  id: number
  title: string
  lessonId: number
  passingScore: number
}

export interface Answer {
  id: number
  text: string
}

export interface Question {
  id: number
  text: string
  answers: Answer[]
}

export interface SubmitAnswerRequest {
  questionId: number
  answerId: number
}

export interface SubmitQuizRequest {
  quizId: number
  answers: SubmitAnswerRequest[]
}

export interface QuizResult {
  quizId: number
  totalQuestions: number
  correctAnswers: number
  score: number
  passed: boolean
}

export interface UserQuizResult {
  id: number
  quizId: number
  quizTitle: string
  score: number
  passed: boolean
  completedAt: string | null
}
