export interface LoginRequest {
  username: string
  password: string
}

export interface RegisterRequest {
  username: string
  email: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  token: string
  newPassword: string
}

export interface LoginResponse {
  token: string
}

export interface ApiError {
  message: string
}
