import { dayKey } from '@/engine/stats'

interface PersistedSession {
  at: string
  kind: string
  wpm: number
  reference?: true
}

interface PersistedDay {
  seconds: number
  blocks: number
  learned: number
  mastered: number
  reference?: number[]
  sessions?: number
}

interface Persisted {
  settings?: Record<string, unknown>
  sessions?: PersistedSession[]
  days?: Record<string, PersistedDay>
  legacy?: unknown
}

/** v1 → v2: Retos count toward the reference speed (`reference: true`); the store gains `days`. */
function toV2(s: Persisted): Persisted {
  const sessions = (s.sessions ?? []).map((r) => (r.kind === 'challenge' ? { ...r, reference: true as const } : r))
  return { ...s, sessions, days: {} }
}

/** v2 → v3: each day keeps its reference speeds and session count (backfilled from sessions); `legacy`; `settings.lastBackupAt`. */
function toV3(s: Persisted): Persisted {
  const days: Record<string, PersistedDay> = {}
  for (const [d, row] of Object.entries(s.days ?? {})) days[d] = { ...row, reference: [], sessions: 0 }
  for (const r of s.sessions ?? []) {
    const d = dayKey(new Date(r.at))
    const prev = days[d] ?? { seconds: 0, blocks: 0, learned: 0, mastered: 0, reference: [], sessions: 0 }
    days[d] = {
      ...prev,
      sessions: (prev.sessions ?? 0) + 1,
      reference: r.reference ? [...(prev.reference ?? []), r.wpm] : prev.reference ?? [],
    }
  }
  return { ...s, days, legacy: null, settings: { ...(s.settings ?? {}), lastBackupAt: null } }
}

export function migrateState(persisted: unknown, version: number): unknown {
  let s = (persisted ?? {}) as Persisted
  if (version < 2) s = toV2(s)
  if (version < 3) s = toV3(s)
  return version >= 3 ? persisted : s
}
