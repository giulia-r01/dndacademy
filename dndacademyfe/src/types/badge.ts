export interface Badge {
  id: number
  name: string
  description: string
  unlockedAt?: string | null
  assignedToUsers: boolean
  usedAsChapterReward: boolean
}

export interface CreateBadgeRequest {
  name: string
  description: string
}

export interface UpdateBadgeRequest {
  name: string
  description: string
}
