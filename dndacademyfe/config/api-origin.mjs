/** @param {string | undefined} value @param {boolean} onVercel */
export function validateApiOrigin(value, onVercel = false) {
  if (!value || value.trim() === "") {
    throw new Error("Configurare NEXT_PUBLIC_API_URL con l'origine del backend prima di avviare o compilare il frontend.")
  }

  let url
  try {
    url = new URL(value)
  } catch {
    throw new Error("NEXT_PUBLIC_API_URL deve essere un'origine HTTP o HTTPS valida.")
  }

  if (!['http:', 'https:'].includes(url.protocol) || value !== url.origin) {
    throw new Error("NEXT_PUBLIC_API_URL deve contenere solo l'origine del backend, senza credenziali, percorsi (anche /api), slash finale, parametri o frammenti. Usare il formato canonico, ad esempio https://backend.example.com.")
  }

  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (onVercel && loopback) {
    throw new Error("Su Vercel NEXT_PUBLIC_API_URL deve indicare il backend pubblico HTTPS, non localhost.")
  }
  if (url.protocol !== 'https:' && (onVercel || !loopback)) {
    throw new Error("NEXT_PUBLIC_API_URL richiede HTTPS; HTTP è consentito soltanto per localhost, 127.0.0.1 o [::1] durante il collaudo locale.")
  }

  return value
}
