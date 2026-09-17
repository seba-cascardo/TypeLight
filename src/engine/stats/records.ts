import type { Days } from './days'
import { weekKey } from './exam'
import { daysBetween } from './index'
import { median, referenceByDay, sessionDay, type SessionLike } from './progress'

/** Personal bests, all on measures that a single easy drill cannot inflate. Derived, never stored. */
export interface Records {
  /** Fastest single reference session (Reto, exam, race, Velocidad text). */
  bestReference: { wpm: number; day: string } | null
  /** Highest median of the last 7 reference days (at least 3). */
  bestMedian7: { wpm: number; day: string } | null
  /** Most accurate ISO week with at least `MIN_WEEK_CHARS` characters. */
  bestWeeklyAcc: { acc: number; week: string; chars: number } | null
  /** Longest run of consecutive days with the full routine. */
  bestRoutineRun: { days: number; endDay: string } | null
}

export const MIN_WEEK_CHARS = 500

export function records(days: Days, sessions: SessionLike[]): Records {
  let bestReference: Records['bestReference'] = null
  for (const [day, row] of Object.entries(days)) {
    for (const wpm of row.reference) if (!bestReference || wpm > bestReference.wpm) bestReference = { wpm, day }
  }

  let bestMedian7: Records['bestMedian7'] = null
  const points = referenceByDay(days)
  for (let i = 2; i < points.length; i++) {
    const wpm = median(points.slice(Math.max(0, i - 6), i + 1).map((p) => p.wpm))
    if (!bestMedian7 || wpm > bestMedian7.wpm) bestMedian7 = { wpm, day: points[i].day }
  }

  const weeks = new Map<string, { chars: number; errors: number }>()
  for (const s of sessions) {
    const w = weekKey(sessionDay(s))
    const acc = weeks.get(w) ?? { chars: 0, errors: 0 }
    acc.chars += s.chars
    acc.errors += s.errors
    weeks.set(w, acc)
  }
  let bestWeeklyAcc: Records['bestWeeklyAcc'] = null
  for (const [week, { chars, errors }] of weeks) {
    if (chars < MIN_WEEK_CHARS) continue
    const acc = chars / (chars + errors)
    if (!bestWeeklyAcc || acc > bestWeeklyAcc.acc) bestWeeklyAcc = { acc, week, chars }
  }

  let bestRoutineRun: Records['bestRoutineRun'] = null
  const full = Object.entries(days)
    .filter(([, r]) => r.blocks >= 4)
    .map(([d]) => d)
    .sort()
  let run = 0
  for (let i = 0; i < full.length; i++) {
    run = i > 0 && daysBetween(full[i - 1], full[i]) === 1 ? run + 1 : 1
    if (!bestRoutineRun || run > bestRoutineRun.days) bestRoutineRun = { days: run, endDay: full[i] }
  }

  return { bestReference, bestMedian7, bestWeeklyAcc, bestRoutineRun }
}
