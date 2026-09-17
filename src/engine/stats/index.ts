import type { KeySample, Metrics } from '../typing'

/**
 * Rolling stats for one key. Latency in ms, error rate 0..1. The smoothing step is weighted by
 * samples (a rare key's single slip barely moves it), and each key carries a forgetting half-life
 * that grows with clean sessions and halves on errors: what is not seen slides back into the Repaso.
 */
export interface KeyStat {
  latencyEma: number
  errorEma: number
  samples: number
  /** Local day the key was last typed (attempted), for "hace N días que no la ves". */
  lastSeen?: string
  /** Forgetting half-life in days (default `HALF_LIFE_MIN`). */
  halfLife?: number
  /** Distinct days with attempts: "dominada" needs at least two. */
  daysSeen?: number
}

export type KeyStats = Record<string, KeyStat>

export const ALPHA_FLOOR = 0.05
export const ALPHA_CAP = 0.5
export const HALF_LIFE_MIN = 3
export const HALF_LIFE_MAX = 30

/** Smoothing step for `attempts` new samples over `prevSamples` old ones. */
export function alphaFor(attempts: number, prevSamples: number): number {
  return Math.max(ALPHA_FLOOR, Math.min(ALPHA_CAP, attempts / (prevSamples + attempts)))
}

/** Longer after a clean session (≥ 3 hits, no error), halved by any error. */
export function nextHalfLife(halfLife: number, errors: number, occurrences: number): number {
  if (errors > 0) return Math.max(HALF_LIFE_MIN, halfLife / 2)
  if (occurrences >= 3) return Math.min(HALF_LIFE_MAX, halfLife * 1.5)
  return halfLife
}

/** Fold a finished session's per-key samples into the rolling stats; `today` stamps `lastSeen` and counts the day. */
export function updateKeyStats(stats: KeyStats, samples: Iterable<KeySample>, today?: string): KeyStats {
  const next: KeyStats = { ...stats }
  for (const s of samples) {
    if (s.occurrences === 0 && s.errors === 0) continue
    const attempts = s.occurrences + s.errors
    const errRate = s.errors / attempts
    const meanLatency = s.latencies.length
      ? s.latencies.reduce((a, b) => a + b, 0) / s.latencies.length
      : undefined
    const prev = next[s.char]
    const newDay = today !== undefined && prev?.lastSeen !== today
    const seen = today ? { lastSeen: today } : {}
    if (!prev) {
      next[s.char] = {
        latencyEma: meanLatency ?? 600,
        errorEma: errRate,
        samples: attempts,
        halfLife: nextHalfLife(HALF_LIFE_MIN, s.errors, s.occurrences),
        daysSeen: newDay ? 1 : 0,
        ...seen,
      }
      continue
    }
    const a = alphaFor(attempts, prev.samples)
    next[s.char] = {
      ...prev,
      latencyEma: meanLatency === undefined ? prev.latencyEma : prev.latencyEma + a * (meanLatency - prev.latencyEma),
      errorEma: prev.errorEma + a * (errRate - prev.errorEma),
      samples: prev.samples + attempts,
      halfLife: nextHalfLife(prev.halfLife ?? HALF_LIFE_MIN, s.errors, s.occurrences),
      daysSeen: (prev.daysSeen ?? 0) + (newDay ? 1 : 0),
      ...seen,
    }
  }
  return next
}

/** Days since the key was last seen, as a multiple of its half-life (0 without a date). */
export function forgetting(stat: KeyStat, today?: string): number {
  if (!today || !stat.lastSeen) return 0
  const gap = daysBetween(stat.lastSeen, today)
  return gap <= 0 ? 0 : gap / (stat.halfLife ?? HALF_LIFE_MIN)
}

/** Higher = weaker. Unknown keys score as "medium" so they get some exposure; unseen keys climb (up to +2). */
export function weaknessScore(stat: KeyStat | undefined, today?: string): number {
  if (!stat) return 1
  return stat.latencyEma / 400 + stat.errorEma * 4 + Math.min(2, forgetting(stat, today))
}

/** The `n` weakest keys among `pool` (letters only, no space). */
export function weakestKeys(stats: KeyStats, pool: Iterable<string>, n = 3, today?: string): string[] {
  const keys = [...pool].filter((c) => c !== ' ')
  return keys
    .map((c) => ({ c, score: weaknessScore(stats[c], today) }))
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
export * from './bigrams'
export * from './words'
export * from './qualities'
export * from './forecast'
export * from './extras'
