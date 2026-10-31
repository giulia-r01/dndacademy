export type UserRole = "PLAYER" | "MASTER"

export type LearningLevel = "BEGINNER" | "INTERMEDIATE" | "ADVANCED"

export interface UserProfile {
  id: number
  username: string
  email: string
  role: UserRole
  learningLevel: LearningLevel
  avatarUrl: string | null
}

export interface UpdateProfileRequest {
  username: string
  email: string
  currentPassword: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
}
