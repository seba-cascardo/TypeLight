/**
 * Rollover: pressing the next key before releasing the previous one. The share of keystrokes that
 * overlap is the best known predictor of typing speed (Feit 2016) — the hand prepares the next key
 * while the current one is still down. Counted from key down/up events; nothing about what is typed changes.
 */
export interface RolloverCounter {
  presses: number
  overlaps: number
  /** Keys currently held down. */
  held: Set<string>
}

export const MIN_ROLLOVER_PRESSES = 20

export function newRollover(): RolloverCounter {
  return { presses: 0, overlaps: 0, held: new Set() }
}

/** A printable key went down (auto-repeat already filtered out by the caller). */
export function trackKeyDown(c: RolloverCounter, key: string): void {
  c.presses++
  if ([...c.held].some((k) => k !== key)) c.overlaps++
  c.held.add(key)
}

export function trackKeyUp(c: RolloverCounter, key: string): void {
  c.held.delete(key)
}

/** Overlapping share, or undefined with too few presses to mean anything. */
export function rolloverRatio(c: RolloverCounter): number | undefined {
  if (c.presses < MIN_ROLLOVER_PRESSES) return undefined
  return c.overlaps / c.presses
}
