import { apiFetch } from "./api"

import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResponse,
  RegisterRequest,
  ResetPasswordRequest,
} from "@/types/auth"

export const authService = {
  login(payload: LoginRequest) {
    return apiFetch<LoginResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  register(payload: RegisterRequest) {
    return apiFetch<void>("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  forgotPassword(payload: ForgotPasswordRequest) {
    return apiFetch<void>("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  resetPassword(payload: ResetPasswordRequest) {
    return apiFetch<void>("/auth/reset-password", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },
}
