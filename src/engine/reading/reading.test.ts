import { describe, expect, it } from 'vitest'
import { BOOKS, type Book } from '../corpus/books'
import { LATAM, US } from '../layouts'
import { bookProgress, lastRead, nextSpot, readingText } from './index'

const book: Book = {
  id: 'b',
  title: 'Libro',
  author: 'Autor',
  year: '1900',
  source: '',
  chapters: [
    { title: 'Uno', pages: ['a', 'b', 'c'] },
    { title: 'Dos', pages: ['d', 'e'] },
  ],
}

describe('reading position', () => {
  it('moves page by page, then to the next chapter, then ends', () => {
    expect(nextSpot(book, { chapter: 0, page: 0 })).toEqual({ chapter: 0, page: 1 })
    expect(nextSpot(book, { chapter: 0, page: 2 })).toEqual({ chapter: 1, page: 0 })
    expect(nextSpot(book, { chapter: 1, page: 1 })).toBeNull()
  })

  it('progress counts the pages before the spot', () => {
    expect(bookProgress(book, undefined)).toEqual({ done: 0, total: 5 })
    expect(bookProgress(book, { chapter: 1, page: 1 })).toEqual({ done: 4, total: 5 })
    expect(bookProgress(book, null)).toEqual({ done: 5, total: 5 })
  })

  it('the last book read is the one read most recently', () => {
    expect(lastRead({})).toBeNull()
    expect(lastRead({ a: { chapter: 0, page: 1, at: '2026-09-24T10:00:00Z' }, b: { chapter: 2, page: 0, at: '2026-09-25T09:00:00Z' } })).toBe('b')
  })
})

describe('reading text', () => {
  it('keeps the page as it is on a Spanish keyboard', () => {
    expect(readingText('Había una vez, ¿no?', LATAM)).toBe('Había una vez, ¿no?')
  })

  it('transliterates what a US keyboard cannot type instead of dropping letters', () => {
    expect(readingText('Había una vez un ñandú, ¿no?', US)).toBe('Habia una vez un nandu, no?')
  })
})

describe('the library', () => {
  const pages = BOOKS.flatMap((b) => b.chapters.flatMap((c) => c.pages))

  it('has Quiroga and Arlt, with pages of a readable size', () => {
    expect(BOOKS.map((b) => b.author)).toEqual(['Horacio Quiroga', 'Roberto Arlt'])
    for (const p of pages) {
      expect(p.length, p).toBeGreaterThanOrEqual(40)
      expect(p.length, p).toBeLessThanOrEqual(700)
    }
  })

  it('is plain typeable text: Spanish letters, ASCII punctuation, one space between words', () => {
    for (const p of pages) {
      expect(p, p).toMatch(/^[A-Za-z0-9áéíóúüñÁÉÍÓÚÜÑ¿¡ .,;:!?()"'\-/%=]+$/)
      expect(p, p).not.toContain('  ')
    }
  })

  it('speaks Rioplatense: no tú forms voseo does not share', () => {
    const tu = /\b(tú|ti|contigo|eres|tienes|puedes|quieres|dices)\b/i
    for (const p of pages) expect(p, p).not.toMatch(tu)
  })

  it('typeable on every layout it is offered on', () => {
    for (const p of pages.slice(0, 50)) expect(readingText(p, LATAM)).toBe(p)
  })
})
