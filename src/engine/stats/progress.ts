import type { Days, DaySummary } from './days'
import { dayKey, daysBetween, type KeyStat, type KeyStats } from './index'

/** The slice of a stored session that Progreso reads; the store's SessionRecord satisfies it. */
export interface SessionLike {
  at: string
  wpm: number
  chars: number
  errors: number
  seconds: number
  reference?: true
  rhythm?: number
}

/** `day` ± n calendar days, as yyyy-mm-dd. */
export function shiftDay(day: string, n: number): string {
  const [y, m, d] = day.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d + n))
  return `${t.getUTCFullYear()}-${String(t.getUTCMonth() + 1).padStart(2, '0')}-${String(t.getUTCDate()).padStart(2, '0')}`
}

export function median(values: number[]): number {
  if (values.length === 0) return 0
  const v = [...values].sort((a, b) => a - b)
  const mid = v.length >> 1
  return v.length % 2 ? v[mid] : Math.round((v[mid - 1] + v[mid]) / 2)
}

/** Local calendar day of a stored session. */
export function sessionDay(s: SessionLike): string {
  return dayKey(new Date(s.at))
}

export interface DayPoint {
  day: string
  wpm: number
  n: number
  /** The weekly exam's speed, on the day it was taken. */
  exam?: number
}

/** Reference sessions (Reto, Velocidad texts, race, exam) folded to one point per local day: the median. Oldest first. */
export function referenceByDay(days: Days): DayPoint[] {
  return Object.entries(days)
    .filter(([, d]) => d.reference.length > 0)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .map(([day, d]) => ({ day, wpm: median(d.reference), n: d.reference.length, ...(d.exam !== undefined && { exam: d.exam }) }))
}

/** True once the median of the last seven days with data (at least three) reaches the speed typed "the old way". */
export function legacyBeaten(points: DayPoint[], legacyWpm: number): boolean {
  const recent = points.slice(-7)
  if (recent.length < 3) return false
  return median(recent.map((p) => p.wpm)) >= legacyWpm
}

export interface Headline {
  value: number
  day: string
  delta: number | null
}

/** Last reference point and its change vs. the nearest point 7 to 10 days earlier. */
export function referenceHeadline(points: DayPoint[]): Headline | null {
  if (points.length === 0) return null
  const last = points[points.length - 1]
  let delta: number | null = null
  for (let back = 7; back <= 10 && delta === null; back++) {
    const p = points.find((x) => x.day === shiftDay(last.day, -back))
    if (p) delta = last.wpm - p.wpm
  }
  return { value: last.wpm, day: last.day, delta }
}

/** Trailing moving average; the first values use the partial window. */
export function movingAverage(values: number[], window = 3): number[] {
  return values.map((_, i) => {
    const slice = values.slice(Math.max(0, i - window + 1), i + 1)
    return slice.reduce((a, b) => a + b, 0) / slice.length
  })
}

export interface UnitMark {
  day: string
  added: number
}

/** Days on which the learned pool grew vs. the previous snapshot (new keys arrived). */
export function unitMarks(days: Days): UnitMark[] {
  const keys = Object.keys(days)
    .filter((d) => days[d].learned > 0)
    .sort()
  const out: UnitMark[] = []
  for (let i = 1; i < keys.length; i++) {
    const added = days[keys[i]].learned - days[keys[i - 1]].learned
    if (added > 0) out.push({ day: keys[i], added })
  }
  return out
}

/** Accuracy over the last 7 days weighted by characters, or null without sessions in that window. */
export function weeklyAccuracy(sessions: SessionLike[], today: string): { acc: number; chars: number } | null {
  let chars = 0
  let errors = 0
  for (const s of sessions) {
    const gap = daysBetween(sessionDay(s), today)
    if (gap < 0 || gap > 6) continue
    chars += s.chars
    errors += s.errors
  }
  if (chars + errors === 0) return null
  return { acc: chars / (chars + errors), chars }
}

export type Mastery = 1 | 2 | 3

/**
 * 3 = mastered, 2 = on track, 1 = weak. `target` is the gap between keys at the unit's goal speed,
 * so the bar rises along the path.
 */
export function mastery(stat: KeyStat | undefined, goalWpm: number): Mastery {
  if (!stat) return 1
  const target = 60000 / (goalWpm * 5)
  if (stat.samples >= 10 && stat.errorEma <= 0.03 && stat.latencyEma <= target) return 3
  if (stat.samples >= 5 && stat.errorEma <= 0.08 && stat.latencyEma <= 1.6 * target) return 2
  return 1
}

const clamp01 = (v: number) => Math.max(0, Math.min(1, v))

/**
 * How owned a key is, 0..1: the weakest of three terms — samples (10 = full), error rate (≤ 3 % full,
 * ≥ 15 % none) and latency (≤ the goal gap full, ≥ twice it none). Drives the fading of the guide hands.
 */
export function dominance(stat: KeyStat | undefined, goalWpm: number): number {
  if (!stat) return 0
  const target = 60000 / (goalWpm * 5)
  const samples = clamp01(stat.samples / 10)
  const error = clamp01(1 - (stat.errorEma - 0.03) / 0.12)
  const latency = clamp01(1 - (stat.latencyEma - target) / target)
  return Math.min(samples, error, latency)
}

/** Mastery of every learned character (space included); unlearned keys are simply absent. */
export function masteryMap(keys: KeyStats, learned: Iterable<string>, goalWpm: number): Record<string, Mastery> {
  const out: Record<string, Mastery> = {}
  for (const c of learned) out[c] = mastery(keys[c], goalWpm)
  return out
}

export interface MasteryCounts {
  mastered: number
  onTrack: number
  weak: number
  learned: number
}

export function masteryCounts(map: Record<string, Mastery>): MasteryCounts {
  const out: MasteryCounts = { mastered: 0, onTrack: 0, weak: 0, learned: 0 }
  for (const lv of Object.values(map)) {
    out.learned++
    if (lv === 3) out.mastered++
    else if (lv === 2) out.onTrack++
    else out.weak++
  }
  return out
}

/** The nearest snapshot (learned > 0) `back`..`back + tolerance` days before `today`, for "hace 7 días". */
export function snapshotBefore(days: Days, today: string, back = 7, tolerance = 3): DaySummary | null {
  for (let b = back; b <= back + tolerance; b++) {
    const d = days[shiftDay(today, -b)]
    if (d && d.learned > 0) return d
  }
  return null
}

export type CalendarState = 'none' | 'part' | 'full'

export interface CalendarCell {
  day: string
  state: CalendarState
  seconds: number
}

/** The last `n` days ending today, oldest first: full routine (4 cards), part, or none. */
export function calendar(days: Days, today: string, n = 28): CalendarCell[] {
  return Array.from({ length: n }, (_, i) => {
    const day = shiftDay(today, i - (n - 1))
    const d = days[day]
    const state: CalendarState = !d || d.blocks === 0 ? 'none' : d.blocks >= 4 ? 'full' : 'part'
    return { day, state, seconds: d?.seconds ?? 0 }
  })
}

export interface Constancy {
  fullOfLast7: number
  /** Mean minutes over the active days of the last 7. */
  minutesPerDay: number
  totalMinutes: number
}

export function constancy(days: Days, today: string): Constancy {
  let full = 0
  let active = 0
  let seconds7 = 0
  let total = 0
  for (const [day, d] of Object.entries(days)) {
    total += d.seconds
    const gap = daysBetween(day, today)
    if (gap < 0 || gap > 6) continue
    if (d.blocks >= 4) full++
    if (d.seconds > 0) {
      active++
      seconds7 += d.seconds
    }
  }
  return { fullOfLast7: full, minutesPerDay: active ? Math.round(seconds7 / active / 60) : 0, totalMinutes: Math.round(total / 60) }
}

/** Mean rhythm of the last 10 sessions that have one, weighted by chars, vs. the 10 before them. */
export function rhythmHeadline(sessions: SessionLike[]): { value: number; delta: number | null } | null {
  const withRhythm = sessions.filter((s): s is SessionLike & { rhythm: number } => typeof s.rhythm === 'number')
  if (withRhythm.length === 0) return null
  const mean = (list: (SessionLike & { rhythm: number })[]) => {
    const weight = list.reduce((a, s) => a + Math.max(1, s.chars), 0)
    return list.reduce((a, s) => a + s.rhythm * Math.max(1, s.chars), 0) / weight
  }
  const recent = withRhythm.slice(-10)
  const before = withRhythm.slice(-20, -10)
  const value = mean(recent)
  return { value, delta: before.length ? value - mean(before) : null }
}
