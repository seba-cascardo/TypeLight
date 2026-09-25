export type SnapshotReason = 'antes-de-reiniciar' | 'antes-de-importar'

export interface BackupFileInfo {
  name: string
  day: string
  reason: SnapshotReason | null
}

export const KEEP_DAYS = 30

/** Dev servers write their own files, so a branch on :5175 never overwrites or rotates the stable build's copies. */
export function backupPrefix(dev: boolean): string {
  return dev ? 'typelight-dev-progreso-' : 'typelight-progreso-'
}

export function autoBackupName(prefix: string, day: string, reason?: SnapshotReason): string {
  return `${prefix}${day}${reason ? `-${reason}` : ''}.json`
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Only names the app writes itself: anything else in the folder is not ours. */
export function parseBackupName(prefix: string, name: string): BackupFileInfo | null {
  const m = new RegExp(`^${escapeRegExp(prefix)}(\\d{4}-\\d{2}-\\d{2})(?:-(antes-de-reiniciar|antes-de-importar))?\\.json$`).exec(name)
  return m ? { name, day: m[1], reason: (m[2] as SnapshotReason | undefined) ?? null } : null
}

/** Newest day first; within a day the running copy (the latest state) before the snapshots. */
export function listBackups(prefix: string, names: string[]): BackupFileInfo[] {
  return names
    .map((n) => parseBackupName(prefix, n))
    .filter((f): f is BackupFileInfo => f !== null)
    .sort((a, b) => b.day.localeCompare(a.day) || Number(a.reason !== null) - Number(b.reason !== null) || a.name.localeCompare(b.name))
}

/** Our files older than the `keepDays` most recent days that have a copy: days with a copy, so a month away doesn't empty the history. */
export function filesToDelete(prefix: string, names: string[], keepDays = KEEP_DAYS): string[] {
  const files = listBackups(prefix, names)
  const keep = new Set([...new Set(files.map((f) => f.day))].slice(0, keepDays))
  return files.filter((f) => !keep.has(f.day)).map((f) => f.name)
}

/** "recién", "hace 12 min", "hace 3 h", or the date. */
export function sinceLabel(at: number, now: number): string {
  const min = Math.floor((now - at) / 60_000)
  if (min < 1) return 'recién'
  if (min < 60) return `hace ${min} min`
  if (min < 24 * 60) return `hace ${Math.floor(min / 60)} h`
  return `el ${new Date(at).toLocaleDateString('es-AR')}`
}

export function reasonLabel(reason: SnapshotReason | null): string {
  if (reason === 'antes-de-reiniciar') return 'antes de reiniciar'
  if (reason === 'antes-de-importar') return 'antes de importar'
  return ''
}

/** `2026-09-05` → `05/09/2026`. */
export function dayLabel(day: string): string {
  const [y, m, d] = day.split('-')
  return `${d}/${m}/${y}`
}
