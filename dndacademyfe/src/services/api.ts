const API_URL = process.env.NEXT_PUBLIC_API_URL

type ApiFetchOptions = RequestInit & {
  auth?: boolean
}

export async function apiFetch<T>(
  endpoint: string,
  options?: ApiFetchOptions,
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null

  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.message || "Errore generico")
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
