import { dayKey, daysBetween } from '@/engine/stats'
import { LAYOUTS } from '@/engine/layouts'
import { migrateState } from '../store/migrate'
import { PERSISTED_KEYS, type PersistedState } from '../store'

export const BACKUP_VERSION = 8

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

const NOT_A_BACKUP = 'No parece una copia de TypeLight.'

function isPlainObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

function isDaySummary(x: unknown): boolean {
  return (
    isPlainObject(x) &&
    Array.isArray(x.reference) &&
    x.reference.every((v) => typeof v === 'number') &&
    typeof x.sessions === 'number'
  )
}

/** Shape-checks a migrated backup before it overwrites the store: every field the app reads must be there and well-formed. */
export function isPersistedState(x: unknown): x is PersistedState {
  if (!isPlainObject(x)) return false
  if (!PERSISTED_KEYS.every((k) => k in x)) return false

  const settings = x.settings
  if (!isPlainObject(settings)) return false
  if (typeof settings.layoutId !== 'string' || !(settings.layoutId in LAYOUTS)) return false
  if (typeof settings.onboarded !== 'boolean') return false

  if (!isPlainObject(x.lessons)) return false
  if (!isPlainObject(x.keys)) return false

  if (!isPlainObject(x.days)) return false
  if (!Object.values(x.days).every(isDaySummary)) return false

  if (!Array.isArray(x.sessions)) return false

  const streak = x.streak
  if (!isPlainObject(streak) || typeof streak.count !== 'number') return false
  if (typeof streak.best !== 'number' || typeof streak.freezes !== 'number' || typeof streak.activeDays !== 'number') return false

  const routine = x.routine
  if (!isPlainObject(routine) || typeof routine.day !== 'string') return false

  const legacy = x.legacy
  if (legacy !== null && (!isPlainObject(legacy) || typeof legacy.wpm !== 'number')) return false

  if (x.lastExamDay !== null && typeof x.lastExamDay !== 'string') return false
  if (x.blindSince !== null && typeof x.blindSince !== 'string') return false
  if (!Array.isArray(x.milestonesSeen)) return false
  if (!isPlainObject(x.bigrams) || !isPlainObject(x.words)) return false
  if (!isPlainObject(x.commitments)) return false
  if (!isPlainObject(x.reading)) return false
  if (x.lastWeeklySummaryWeek !== null && typeof x.lastWeeklySummaryWeek !== 'string') return false

  return true
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
    return { ok: false, error: NOT_A_BACKUP }
  }
  if (b.version > BACKUP_VERSION) {
    return { ok: false, error: `La copia es de una versión más nueva (${b.version}) que esta app (${BACKUP_VERSION}).` }
  }
  let state: unknown
  try {
    state = migrateState(b.state, b.version)
  } catch {
    return { ok: false, error: NOT_A_BACKUP }
  }
  if (!isPersistedState(state)) {
    return { ok: false, error: NOT_A_BACKUP }
  }
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
  // Some browsers still read the href when the click is dispatched; revoke on the next tick so the download can start.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
