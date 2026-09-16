import { resolveChar, type Layout } from '../layouts'

/** Characters from the pool that take a single key press (no space, no dead keys, no shift). */
export function pickLetters(layout: Layout, pool: readonly string[]): string[] {
  return pool.filter((c) => {
    if (c === ' ') return false
    const seq = resolveChar(layout, c)
    return seq !== null && seq.length === 1 && !seq[0].shift && !seq[0].altGr
  })
}
