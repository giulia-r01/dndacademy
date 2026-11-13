import { trackBackendRequest } from "@/lib/backend-activity"

const API_URL = process.env.NEXT_PUBLIC_API_URL

type ApiFetchOptions = RequestInit & {
  auth?: boolean
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
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
  const controller = new AbortController()
  const abort = () => controller.abort(options.signal?.reason)
  if (options.signal?.aborted) abort()
  else options.signal?.addEventListener("abort", abort, { once: true })
  const timeout = setTimeout(() => controller.abort(), 120000)
  const finish = trackBackendRequest()
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      signal: controller.signal,
      headers: {
        ...(options.auth && token ? { Authorization: `Bearer ${token}` } : {}),
        ...(isFormData ? {} : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    })

    if (!response.ok) {
      const error = await response.json().catch(() => null)
      if (
        response.status === 401 &&
        options.auth &&
        typeof window !== "undefined" &&
        token === localStorage.getItem("token")
      ) {
        window.dispatchEvent(new Event("session-expired"))
      }
      throw new ApiError(
        error?.message ||
          (response.status === 401
            ? "Sessione scaduta. Accedi nuovamente."
            : response.status >= 500
              ? "Il server è temporaneamente non disponibile o si sta avviando. Attendi e riprova."
              : "Impossibile completare la richiesta."),
        response.status,
      )
    }

    if (response.status === 204) {
      return undefined as T
    }

    const text = await response.text()

    if (!text) {
      return undefined as T
    }

    return JSON.parse(text) as T
  } catch (err) {
    if (options.signal?.aborted || err instanceof ApiError) throw err
    if (controller.signal.aborted)
      throw new ApiError(
        "Il server non ha risposto in tempo. Attendi qualche istante e riprova.",
        0,
      )
    if (err instanceof SyntaxError) throw new ApiError("Il server ha restituito una risposta non valida. Riprova tra qualche istante.", 0)
    throw new ApiError(
      "Impossibile contattare il server. Controlla la connessione e riprova.",
      0,
    )
  } finally {
    clearTimeout(timeout)
    options.signal?.removeEventListener("abort", abort)
    finish()
  }
}
