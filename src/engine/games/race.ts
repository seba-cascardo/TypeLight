import { sentencesText, wordsText, type Rng } from '../generator'
import { dayKey, daysBetween } from '../stats'

/** The ghost runs at the best reference session of the last 7 days, or at the goal when there is none. */
export function ghostWpm(sessions: readonly { at: string; wpm: number; reference?: true }[], today: string, fallback: number): number {
  let best = 0
  for (const s of sessions) {
    if (!s.reference) continue
    const gap = daysBetween(dayKey(new Date(s.at)), today)
    if (gap < 0 || gap > 6) continue
    best = Math.max(best, s.wpm)
  }
  return best > 0 ? best : fallback
}

/** Where the ghost's speed came from. A game result keeps it as its index in GHOST_SOURCES (details are numbers). */
export type GhostSource = 'lesson' | 'week' | 'goal' | 'month'
export const GHOST_SOURCES: readonly GhostSource[] = ['lesson', 'week', 'goal', 'month']

/**
 * The ghost of a race. A lesson that names its speed in the title (`atGoal`) runs at its goal: that's the
 * promise. Otherwise the best reference of the week, or the goal when there is none.
 */
export function raceGhost(sessions: Parameters<typeof ghostWpm>[0], today: string, goalWpm: number, atGoal = false): { wpm: number; source: GhostSource } {
  if (atGoal) return { wpm: goalWpm, source: 'lesson' }
  const best = ghostWpm(sessions, today, 0)
  return best > 0 ? { wpm: best, source: 'week' } : { wpm: goalWpm, source: 'goal' }
}

/** Three real sentences when the pool allows them, otherwise a run of real words. */
export function raceText(pool: ReadonlySet<string>, rng: Rng): string {
  return sentencesText(pool, 3, { rng }) || wordsText(pool, 24, { rng })
}

/** Characters the ghost has covered after `elapsedMs`. */
export function ghostPos(elapsedMs: number, wpm: number, length: number): number {
  return Math.min(length, (elapsedMs / 1000) * ((wpm * 5) / 60))
}

export function ghostFinishMs(wpm: number, length: number): number {
  return (length / ((wpm * 5) / 60)) * 1000
}

/** Who got to the flag first, and by how many seconds (negative when the ghost won). */
export function raceOutcome(playerMs: number, wpm: number, length: number): { won: boolean; marginSeconds: number } {
  const g = ghostFinishMs(wpm, length)
  return { won: playerMs < g, marginSeconds: Math.round(((g - playerMs) / 1000) * 10) / 10 }
}
