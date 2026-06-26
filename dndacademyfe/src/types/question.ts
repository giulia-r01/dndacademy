export interface PlayerAnswer {
  id: number
  text: string
}

export interface PlayerQuestion {
  id: number
  text: string
  answers: PlayerAnswer[]
}

export interface AdminAnswer {
  id: number
  text: string
  correct: boolean
}

export interface AdminQuestion {
  id: number
  text: string
  answers: AdminAnswer[]
}

export interface CreateAnswerRequest {
  text: string
  correct: boolean
}

export interface CreateQuestionRequest {
  quizId: number
  text: string
  answers: CreateAnswerRequest[]
}

export interface UpdateQuestionRequest {
  text: string
}
