let pending = 0
const listeners = new Set<() => void>()

export function getPendingBackendRequests() {
  return pending
}
export function getServerBackendRequests() {
  return 0
}
export function subscribeToBackendRequests(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function trackBackendRequest() {
  if (typeof window === "undefined") return () => {}
  let announced = false
  const timer = setTimeout(() => {
    announced = true
    pending++
    listeners.forEach((listener) => listener())
  }, 3000)
  return () => {
    clearTimeout(timer)
    if (announced) {
      pending--
      listeners.forEach((listener) => listener())
    }
  }
}
