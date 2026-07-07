import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Load .env.local into process.env (strips inline `# ...` comments).
export function loadEnv() {
  const root = join(dirname(fileURLToPath(import.meta.url)), '..')
  let raw
  try {
    raw = readFileSync(join(root, '.env.local'), 'utf8')
  } catch {
    return
  }
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1)
    // strip a trailing inline comment ( space + # ... ), then quotes/whitespace
    val = val.replace(/\s+#.*$/, '').trim().replace(/^['"]|['"]$/g, '')
    if (!(key in process.env)) process.env[key] = val
  }
}

export function requireEnv(...keys) {
  const missing = keys.filter((k) => !process.env[k])
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(', ')}`)
    process.exit(1)
  }
}
