import { canType, type Layout } from '../layouts'
import type { Days } from './days'
import { daysBetween } from './index'
import { median } from './progress'

export const OWN_TEXT_MAX = 1500

const TYPOGRAPHIC: [RegExp, string][] = [
  [/[“”„«»]/g, '"'],
  [/[‘’‚]/g, "'"],
  [/[—–]/g, '-'],
  [/…/g, '...'],
  [/ /g, ' '],
]

/** A pasted text made typeable: one space between words, ASCII punctuation, only the layout's characters, capped. */
export function prepareOwnText(text: string, layout: Layout): string {
  let t = text
  for (const [re, to] of TYPOGRAPHIC) t = t.replace(re, to)
  t = [...t].filter((c) => c === ' ' || /\s/.test(c) || canType(layout, c)).join('')
  t = t.replace(/\s+/g, ' ').trim()
  return t.slice(0, OWN_TEXT_MAX).trim()
}

/** FNV-1a over a string, for reproducible seeds (the Reto of the day, the exam of the month). */
export function seedOf(key: string): number {
  let h = 0x811c9dc5
  for (const c of key) {
    h ^= c.codePointAt(0) ?? 0
    h = Math.imul(h, 0x01000193) >>> 0
  }
  return h
}

/** The ghost "you, 30 days ago": median reference of the days 30 to 36 days back, or null. */
export function ghostWpm30(days: Days, today: string): number | null {
  const refs: number[] = []
  for (const [day, row] of Object.entries(days)) {
    const gap = daysBetween(day, today)
    if (gap >= 30 && gap <= 36) refs.push(...row.reference)
  }
  return refs.length ? median(refs) : null
}
