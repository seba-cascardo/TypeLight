import type { PersistStorage, StorageValue } from 'zustand/middleware'

/** The raw text of a saved state that failed to load, kept aside so nothing overwrites it. */
export const RESCUE_KEY = 'typelight.v1.rescate'
/** The raw text right before the last migration: a net to rescue by hand, with no UI. */
export const PRE_MIGRATION_KEY = 'typelight.v1.antes-de-migrar'

let blocked = false
let lastRaw: string | null = null
const listeners = new Set<() => void>()

function trySet(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Over quota: go on without the copy.
  }
}

/**
 * localStorage for zustand `persist` that refuses to write while a failed load is unresolved.
 * Without it, persist keeps the empty state after a failed hydration and the first `set` writes it over the saved one.
 */
export function guardedStorage<S>(): PersistStorage<S> {
  return {
    getItem: (name) => {
      const raw = localStorage.getItem(name)
      lastRaw = raw
      return raw === null ? null : (JSON.parse(raw) as StorageValue<S>)
    },
    setItem: (name, value) => {
      if (blocked) return
      localStorage.setItem(name, JSON.stringify(value))
    },
    removeItem: (name) => {
      if (blocked) return
      localStorage.removeItem(name)
    },
  }
}

/** The load failed: keep the raw text aside and stop every write until the person decides. */
export function blockWrites(): void {
  if (lastRaw !== null) trySet(RESCUE_KEY, lastRaw)
  blocked = true
  listeners.forEach((l) => l())
}

/** "Empezar de cero" or a restored copy: writes go through again; the rescue copy stays where it is. */
export function unblockWrites(): void {
  blocked = false
  listeners.forEach((l) => l())
}

export function isWriteBlocked(): boolean {
  return blocked
}

export function subscribeWriteBlocked(listener: () => void): () => void {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

/** Called by `migrate`: persist rewrites the saved text right after migrating. */
export function keepPreMigrationCopy(): void {
  if (lastRaw !== null) trySet(PRE_MIGRATION_KEY, lastRaw)
}

/** Ask the browser not to evict the data on its own. Chrome decides silently; Firefox asks once. */
export function requestPersistence(): void {
  navigator.storage?.persist?.().catch(() => {})
}
