import { dayKey, daysBetween } from '@/engine/stats'
import { migrateState } from '../store/migrate'
import type { PersistedState } from '../store'

export const BACKUP_VERSION = 3

export interface Backup {
  app: 'typelight'
  version: number
  exportedAt: string
  state: PersistedState
}

export type ParsedBackup = { ok: true; state: PersistedState; exportedAt: string } | { ok: false; error: string }

export function backupFilename(now: Date = new Date()): string {
  return `typelight-progreso-${dayKey(now)}.json`
}

export function serializeBackup(state: PersistedState, now: Date = new Date()): string {
  const backup: Backup = { app: 'typelight', version: BACKUP_VERSION, exportedAt: now.toISOString(), state }
  return JSON.stringify(backup, null, 2)
}

/** Validate and (if older) migrate a backup file's text. */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown
  try {
    raw = JSON.parse(text)
  } catch {
    return { ok: false, error: 'No parece una copia de TypeLight: el archivo no es JSON.' }
  }
  const b = raw as Partial<Backup> | null
  if (!b || b.app !== 'typelight' || typeof b.version !== 'number' || !b.state || typeof b.state !== 'object') {
    return { ok: false, error: 'No parece una copia de TypeLight.' }
  }
  if (b.version > BACKUP_VERSION) {
    return { ok: false, error: `La copia es de una versión más nueva (${b.version}) que esta app (${BACKUP_VERSION}).` }
  }
  const state = migrateState(b.state, b.version) as PersistedState
  return { ok: true, state, exportedAt: typeof b.exportedAt === 'string' ? b.exportedAt : '' }
}

/** A reminder is due 30 days after the last backup, or after two weeks of activity without one. */
export function backupDue(lastBackupAt: string | null | undefined, today: string, activeDays: number): boolean {
  if (!lastBackupAt) return activeDays >= 14
  return daysBetween(dayKey(new Date(lastBackupAt)), today) >= 30
}

export function downloadText(filename: string, text: string): void {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
