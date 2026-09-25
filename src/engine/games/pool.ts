import { candidateWords, poolOf } from '../generator'
import { resolveChar, type Layout } from '../layouts'

/** Characters from the pool that take a single key press (no space, no dead keys, no shift). */
export function pickLetters(layout: Layout, pool: readonly string[]): string[] {
  return pool.filter((c) => {
    if (c === ' ') return false
    const seq = resolveChar(layout, c)
    return seq !== null && seq.length === 1 && !seq[0].shift && !seq[0].altGr
  })
}

/**
 * Words for Al compás with words: real words of 3 to 6 letters typed with one key each (Al compás reads the
 * key pressed, so no tildes, which are two, and no Shift). Empty when the pool has fewer than ten.
 */
export function rhythmWords(layout: Layout, pool: readonly string[]): string[] {
  const single = new Set(pickLetters(layout, pool))
  const words = candidateWords(poolOf(single), 600).filter((w) => w.length >= 3 && w.length <= 6 && [...w].every((c) => single.has(c)))
  return words.length >= 10 ? words : []
}
