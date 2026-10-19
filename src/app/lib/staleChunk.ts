// Every deploy renames the lazy screens' chunks and GitHub Pages drops the old ones: a tab opened before the
// deploy fails to load its next screen. Reloading once picks up the new version; a second failure within a
// minute is a real outage, so it shows the error screen instead of looping.

const KEY = 'typelight.reloadedAt'
const WINDOW_MS = 60_000

/** Chrome, Firefox and Safari word a failed `import()` differently; Vite adds its own for CSS. */
export function isStaleChunkError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '')
  return /Failed to fetch dynamically imported module|error loading dynamically imported module|Importing a module script failed|Unable to preload CSS/i.test(message)
}

export function shouldReload(lastAt: number | null, now: number): boolean {
  return lastAt === null || !(now - lastAt < WINDOW_MS)
}

/** Reloads the page unless it already did in the last minute; returns whether it reloads. */
export function reloadForNewVersion(now = Date.now()): boolean {
  let lastAt: number | null = null
  try {
    const raw = sessionStorage.getItem(KEY)
    lastAt = raw === null ? null : Number(raw)
  } catch {
    // Storage blocked: reload anyway, the guard is only against loops.
  }
  if (!shouldReload(lastAt, now)) return false
  try {
    sessionStorage.setItem(KEY, String(now))
  } catch {
    return false
  }
  window.location.reload()
  return true
}
