import type { Book } from '../corpus/books'
import { canType, type Layout } from '../layouts'
import { prepareOwnText } from '../stats'

export type { Book, BookChapter } from '../corpus/books'
export { BOOKS } from '../corpus/books'

/** Where the reader goes next: a chapter and a page inside it, both 0-based. */
export interface Spot {
  chapter: number
  page: number
}

/**
 * The page as the layout can type it. A Spanish keyboard types it as written; one that cannot (US)
 * gets the accents and the ñ transliterated (á → a, ñ → n) instead of losing the letters.
 */
export function readingText(page: string, layout: Layout): string {
  if ([...page].every((c) => c === ' ' || canType(layout, c))) return page
  const plain = [...page].map((c) => (c === ' ' || canType(layout, c) ? c : c.normalize('NFD').replace(/[̀-ͯ]/g, ''))).join('')
  return prepareOwnText(plain, layout)
}

/** The page after `spot`: the next one in the chapter, the first of the next chapter, or null at the end of the book. */
export function nextSpot(book: Book, spot: Spot): Spot | null {
  if (spot.page + 1 < book.chapters[spot.chapter].pages.length) return { chapter: spot.chapter, page: spot.page + 1 }
  if (spot.chapter + 1 < book.chapters.length) return { chapter: spot.chapter + 1, page: 0 }
  return null
}

/** Pages typed so far (the ones before `spot`) out of the whole book. `undefined` = not started, `null` = finished. */
export function bookProgress(book: Book, spot: Spot | null | undefined): { done: number; total: number } {
  const total = book.chapters.reduce((a, c) => a + c.pages.length, 0)
  if (spot === null) return { done: total, total }
  if (!spot) return { done: 0, total }
  const before = book.chapters.slice(0, spot.chapter).reduce((a, c) => a + c.pages.length, 0)
  return { done: before + spot.page, total }
}

/** The book read most recently, by the time its position was saved. */
export function lastRead<T extends { at: string }>(reading: Record<string, T>): string | null {
  let best: string | null = null
  for (const [id, r] of Object.entries(reading)) if (best === null || r.at > reading[best].at) best = id
  return best
}
