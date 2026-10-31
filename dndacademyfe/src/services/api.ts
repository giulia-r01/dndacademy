const API_URL = process.env.NEXT_PUBLIC_API_URL

type ApiFetchOptions = RequestInit & {
  auth?: boolean
}

export class ApiError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message)
    this.name = "ApiError"
  }
}

export async function apiFetch<T>(
  endpoint: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null

  const isFormData = options.body instanceof FormData

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(options.auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    if (response.status === 401 && options.auth && typeof window !== "undefined" && token === localStorage.getItem("token")) {
      window.dispatchEvent(new Event("session-expired"))
    }
    throw new ApiError(error?.message || (response.status === 401 ? "Sessione scaduta. Accedi nuovamente." : "Impossibile completare la richiesta."), response.status)
  }

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()

  if (!text) {
    return undefined as T
  }

  return JSON.parse(text) as T
}
