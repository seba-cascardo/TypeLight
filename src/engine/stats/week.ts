import type { Days } from './days'
import { weekKey } from './exam'
import { median, sessionDay, shiftDay, type SessionLike } from './progress'

/** Days with practice time in the ISO week that contains `today`. */
export function weekActiveDays(days: Days, today: string): number {
  const week = weekKey(today)
  return Object.entries(days).filter(([d, row]) => row.seconds > 0 && weekKey(d) === week).length
}

/** Weeks whose active days reached the weekly goal. */
export function activeWeeks(days: Days, goal: number): number {
  const perWeek = new Map<string, number>()
  for (const [d, row] of Object.entries(days)) {
    if (row.seconds <= 0) continue
    const w = weekKey(d)
    perWeek.set(w, (perWeek.get(w) ?? 0) + 1)
  }
  return [...perWeek.values()].filter((n) => n >= goal).length
}

export interface WeekNumbers {
  /** Monday of the week summarised. */
  week: string
  minutes: number
  activeDays: number
  refMedian: number | null
  /** vs. the week before, in PPM. */
  refDelta: number | null
  acc: number | null
  /** vs. the week before, as a fraction (0.01 = one point). */
  accDelta: number | null
  masteredNew: number
}

export interface WeekSummary extends WeekNumbers {
  win: string
}

function weekRows(days: Days, week: string): [string, Days[string]][] {
  return Object.entries(days)
    .filter(([d]) => weekKey(d) === week)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
}

function weekAccuracy(sessions: SessionLike[], week: string): number | null {
  let chars = 0
  let errors = 0
  for (const s of sessions) {
    if (weekKey(sessionDay(s)) !== week) continue
    chars += s.chars
    errors += s.errors
  }
  return chars + errors === 0 ? null : chars / (chars + errors)
}

/** The one concrete thing that went right, in priority order. */
export function weekWin(n: WeekNumbers, goal: number): string {
  if (n.refDelta !== null && n.refDelta > 0) return `+${n.refDelta} PPM de velocidad de referencia`
  if (n.masteredNew > 0) return n.masteredNew === 1 ? '1 tecla nueva dominada' : `${n.masteredNew} teclas nuevas dominadas`
  if (n.accDelta !== null && n.accDelta >= 0.01) return `+${Math.round(n.accDelta * 100)} ${Math.round(n.accDelta * 100) === 1 ? 'punto' : 'puntos'} de precisión`
  if (n.activeDays >= goal) return `meta semanal cumplida: ${n.activeDays} de ${goal} días`
  return `${n.minutes} minutos: todos cuentan`
}

/** The week before the one containing `today`, or null when it had no activity. */
export function weeklySummary(days: Days, sessions: SessionLike[], today: string, goal: number): WeekSummary | null {
  const week = weekKey(shiftDay(weekKey(today), -1))
  const before = weekKey(shiftDay(week, -1))
  const rows = weekRows(days, week)
  const active = rows.filter(([, r]) => r.seconds > 0)
  if (active.length === 0) return null

  const minutes = Math.round(rows.reduce((a, [, r]) => a + r.seconds, 0) / 60)
  const refs = rows.flatMap(([, r]) => r.reference)
  const refsBefore = weekRows(days, before).flatMap(([, r]) => r.reference)
  const refMedian = refs.length ? median(refs) : null
  const refDelta = refMedian !== null && refsBefore.length ? refMedian - median(refsBefore) : null
  const acc = weekAccuracy(sessions, week)
  const accBefore = weekAccuracy(sessions, before)
  const accDelta = acc !== null && accBefore !== null ? acc - accBefore : null

  const snapshots = rows.filter(([, r]) => r.learned > 0)
  const lastMastered = snapshots.length ? snapshots[snapshots.length - 1][1].mastered : null
  const earlier = Object.entries(days)
    .filter(([d, r]) => d < week && r.learned > 0)
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
  const prevMastered = earlier.length ? earlier[earlier.length - 1][1].mastered : 0
  const masteredNew = lastMastered === null ? 0 : Math.max(0, lastMastered - prevMastered)

  const numbers: WeekNumbers = { week, minutes, activeDays: active.length, refMedian, refDelta, acc, accDelta, masteredNew }
  return { ...numbers, win: weekWin(numbers, goal) }
}

/** Active days against the weekly goal: «3 de 5 días», and past it «6 días, meta de 5 cumplida» (never «6 de 5»). */
export function weekGoalLabel(days: number, goal: number): string {
  if (days < goal) return `${days} de ${goal} días`
  if (days === goal) return `${days} de ${goal} días, meta cumplida`
  return `${days} días, meta de ${goal} cumplida`
}
