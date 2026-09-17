import type { KeySample, Metrics } from '../typing'

/** Rolling stats for one key. Latency in ms, error rate 0..1. */
export interface KeyStat {
  latencyEma: number
  errorEma: number
  samples: number
  /** Local day the key was last typed (attempted), for "hace N días que no la ves". */
  lastSeen?: string
}

export type KeyStats = Record<string, KeyStat>

const ALPHA = 0.25

/** Fold a finished session's per-key samples into the rolling stats; `today` stamps `lastSeen`. */
export function updateKeyStats(stats: KeyStats, samples: Iterable<KeySample>, today?: string): KeyStats {
  const next: KeyStats = { ...stats }
  for (const s of samples) {
    if (s.occurrences === 0 && s.errors === 0) continue
    const attempts = s.occurrences + s.errors
    const errRate = s.errors / attempts
    const meanLatency = s.latencies.length
      ? s.latencies.reduce((a, b) => a + b, 0) / s.latencies.length
      : undefined
    const seen = today ? { lastSeen: today } : {}
    const prev = next[s.char]
    if (!prev) {
      next[s.char] = { latencyEma: meanLatency ?? 600, errorEma: errRate, samples: attempts, ...seen }
      continue
    }
    next[s.char] = {
      ...prev,
      latencyEma: meanLatency === undefined ? prev.latencyEma : prev.latencyEma + ALPHA * (meanLatency - prev.latencyEma),
      errorEma: prev.errorEma + ALPHA * (errRate - prev.errorEma),
      samples: prev.samples + attempts,
      ...seen,
    }
  }
  return next
}

/** Higher = weaker. Unknown keys score as "medium" so they get some exposure. */
export function weaknessScore(stat: KeyStat | undefined): number {
  if (!stat) return 1
  return stat.latencyEma / 400 + stat.errorEma * 4
}

/** The `n` weakest keys among `pool` (letters only, no space). */
export function weakestKeys(stats: KeyStats, pool: Iterable<string>, n = 3): string[] {
  const keys = [...pool].filter((c) => c !== ' ')
  return keys
    .map((c) => ({ c, score: weaknessScore(stats[c]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, n)
    .map((x) => x.c)
}

/** Estimated speed for a key in "keys per minute", for heat maps. */
export function keySpeed(stat: KeyStat | undefined): number | null {
  if (!stat || stat.samples < 3) return null
  return Math.round(60000 / Math.max(stat.latencyEma, 1))
}

export type Stars = 0 | 1 | 2 | 3

/** ★ finished · ★★ accuracy ≥ 95 % · ★★★ accuracy ≥ 97 % and speed at goal. */
export function starsFor(m: Metrics, goalWpm: number): Stars {
  if (m.chars === 0) return 0
  if (m.accuracy >= 0.97 && m.wpm >= goalWpm) return 3
  if (m.accuracy >= 0.95) return 2
  return 1
}

/** 1-based day of the year, local time. */
export function dayOfYear(d: Date = new Date()): number {
  const start = new Date(d.getFullYear(), 0, 0)
  return Math.floor((d.getTime() - start.getTime()) / 86400000)
}

/** Local calendar day as yyyy-mm-dd. */
export function dayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function daysBetween(a: string, b: string): number {
  const [ay, am, ad] = a.split('-').map(Number)
  const [by, bm, bd] = b.split('-').map(Number)
  const da = Date.UTC(ay, am - 1, ad)
  const db = Date.UTC(by, bm - 1, bd)
  return Math.round((db - da) / 86400000)
}

/**
 * A streak that forgives. An active day is a day with a recorded session. One missed day is
 * always forgiven ("never twice"); further missed days cost a freeze each. Freezes are earned
 * automatically, one every `FREEZE_EVERY` active days, up to `MAX_FREEZES`, and spent on their own.
 */
export interface Streak {
  count: number
  lastDay: string | null
  best: number
  freezes: number
  /** Days with at least one session, ever. Milestones count these. */
  activeDays: number
}

export const MAX_FREEZES = 2
export const FREEZE_EVERY = 5

export function emptyStreak(): Streak {
  return { count: 0, lastDay: null, best: 0, freezes: 0, activeDays: 0 }
}

/** Days since the last active day, or null before any activity. */
export function streakGap(streak: Streak, today: string): number | null {
  return streak.lastDay ? daysBetween(streak.lastDay, today) : null
}

/** Register activity on `today`. */
export function bumpStreak(streak: Streak, today: string): Streak {
  if (streak.lastDay === today) return streak
  const gap = streakGap(streak, today)
  let count: number
  let freezes = streak.freezes
  if (gap === null) count = 1
  else if (gap <= 2) count = streak.count + 1
  else if (gap - 2 <= freezes) {
    freezes -= gap - 2
    count = streak.count + 1
  } else count = 1
  const activeDays = streak.activeDays + 1
  if (activeDays % FREEZE_EVERY === 0) freezes = Math.min(MAX_FREEZES, freezes + 1)
  return { count, lastDay: today, best: Math.max(streak.best, count), freezes, activeDays }
}

/** Still alive while practising today would continue it (one free day plus the freezes). */
export function streakAlive(streak: Streak, today: string): boolean {
  const gap = streakGap(streak, today)
  return gap !== null && gap <= 2 + streak.freezes
}

/** Alive, but today is the day it needs. */
export function streakAtRisk(streak: Streak, today: string): boolean {
  const gap = streakGap(streak, today)
  return gap !== null && gap >= 2 && streakAlive(streak, today)
}

export function formatAccuracy(acc: number): string {
  return `${Math.round(acc * 100)} %`
}

export * from './days'
export * from './progress'
export * from './rollover'
export * from './exam'
export * from './week'
export * from './records'
export * from './milestones'
export * from './reasons'
