import type { Days } from './days'
import { daysBetween } from './index'
import { median } from './progress'

/** Active days that mean something: a week, two, a month, Lally's 66, a hundred. */
export const MILESTONES = [7, 14, 30, 66, 100] as const

/** The highest milestone reached and not yet closed, or null. */
export function milestoneReached(activeDays: number, seen: readonly number[]): number | null {
  const reached = MILESTONES.filter((m) => m <= activeDays)
  const top = reached[reached.length - 1]
  return top !== undefined && !seen.includes(top) ? top : null
}

export function milestoneCopy(m: number): string {
  switch (m) {
    case 7:
      return 'Una semana de teclado. Ya es un principio.'
    case 14:
      return 'Dos semanas. La primera bajada de velocidad ya pasó; desde acá sube.'
    case 30:
      return 'Un mes. Esto es lo que cambió en treinta días.'
    case 66:
      return 'Sesenta y seis días. A partir de acá ya es hábito para la mayoría (Lally 2010): no hace falta fuerza de voluntad, hace falta el ancla.'
    case 100:
      return 'Cien días. Los dedos de antes ya no existen.'
    default:
      return `${m} días activos.`
  }
}

export interface MonthSummary {
  minutes: number
  activeDays: number
  /** Median reference of the last 7 days vs. the 7 days ending 30 days ago. */
  refNow: number | null
  refThen: number | null
  /** Last mastered-keys snapshot vs. the last one at least 30 days old. */
  masteredNow: number | null
  masteredThen: number | null
}

/** The last 30 days, for the one-month milestone. */
export function monthSummary(days: Days, today: string): MonthSummary {
  let seconds = 0
  let activeDays = 0
  const now: number[] = []
  const then: number[] = []
  let masteredNow: { day: string; n: number } | null = null
  let masteredThen: { day: string; n: number } | null = null
  for (const [day, row] of Object.entries(days)) {
    const gap = daysBetween(day, today)
    if (gap < 0) continue
    if (gap < 30) {
      seconds += row.seconds
      if (row.seconds > 0) activeDays++
    }
    if (gap <= 6) now.push(...row.reference)
    if (gap >= 30 && gap <= 36) then.push(...row.reference)
    if (row.learned > 0) {
      if (!masteredNow || day > masteredNow.day) masteredNow = { day, n: row.mastered }
      if (gap >= 30 && (!masteredThen || day > masteredThen.day)) masteredThen = { day, n: row.mastered }
    }
  }
  return {
    minutes: Math.round(seconds / 60),
    activeDays,
    refNow: now.length ? median(now) : null,
    refThen: then.length ? median(then) : null,
    masteredNow: masteredNow?.n ?? null,
    masteredThen: masteredThen?.n ?? null,
  }
}
