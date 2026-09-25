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

/** A place as the store keeps it: indices, the chapter's title (indices move when the library is rebuilt), finished. */
export interface SavedSpot {
  chapter: number
  page: number
  title?: string
  done?: boolean
}

/**
 * The saved place, made safe for this build of the library: the chapter is found by title first, a chapter
 * that no longer exists restarts the book (undefined), a page past the end goes to the chapter's last page.
 * `undefined` = not started, `null` = finished.
 */
export function resolveSpot(book: Book, saved: SavedSpot | undefined): Spot | null | undefined {
  if (!saved) return undefined
  if (saved.done) return null
  const byTitle = saved.title === undefined ? -1 : book.chapters.findIndex((c) => c.title === saved.title)
  const chapter = byTitle >= 0 ? byTitle : saved.title === undefined && saved.chapter < book.chapters.length ? saved.chapter : -1
  if (chapter < 0) return undefined
  return { chapter, page: Math.max(0, Math.min(saved.page, book.chapters[chapter].pages.length - 1)) }
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
