interface Persisted {
  sessions?: { kind: string; reference?: true }[]
  days?: object
}

/** v1 → v2: Retos count toward the reference speed (`reference: true`); the store gains `days`. */
export function migrateState(persisted: unknown, version: number): unknown {
  if (version >= 2) return persisted
  const s = (persisted ?? {}) as Persisted
  const sessions = (s.sessions ?? []).map((r) => (r.kind === 'challenge' ? { ...r, reference: true as const } : r))
  return { ...s, sessions, days: {} }
}
