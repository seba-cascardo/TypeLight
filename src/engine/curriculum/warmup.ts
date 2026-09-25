import type { GameId } from './types'

/** Words games need the space bar and a handful of letters, like the free-play row in Inicio. */
export function wordsReady(learned: readonly string[]): boolean {
  return learned.includes(' ') && learned.filter((c) => /^[a-zñ]$/.test(c)).length >= 8
}

/**
 * One day in three the warm-up is a game — Al compás (a beat a little under your speed keeps the
 * new fingering in charge) and Globos alternating, so the novelty rotates just as it wears off.
 * Null = the plain warm-up: on the other days, or before there are enough keys to play. `nextGame` is the
 * game the next lesson of the path already is: the warm-up never repeats it in the same routine.
 */
export function warmupGame(dayOfYear: number, learned: readonly string[], nextGame?: GameId | null): 'rhythm' | 'balloons' | null {
  if (dayOfYear % 3 !== 0) return null
  const letters = learned.filter((c) => c !== ' ').length
  if (letters < 6) return null
  const balloons = Math.floor(dayOfYear / 3) % 2 === 0
  const pick = balloons && wordsReady(learned) ? 'balloons' : 'rhythm'
  if (pick !== nextGame) return pick
  if (pick === 'rhythm') return wordsReady(learned) ? 'balloons' : null
  return 'rhythm'
}
