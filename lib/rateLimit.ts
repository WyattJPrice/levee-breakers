const store = new Map<string, { count: number; resetAt: number }>()

export function isRateLimited(ip: string, windowMs = 60 * 60 * 1000, max = 1): boolean {
  const now = Date.now()

  if (store.size > 5000) store.clear()

  const entry = store.get(ip)
  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs })
    return false
  }
  if (entry.count >= max) return true
  entry.count++
  return false
}
