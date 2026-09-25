import { describe, expect, it } from 'vitest'
import { makeRng } from '../generator'
import { LATAM } from '../layouts'
import { rhythmWords } from './pool'
import { schedule, startRound, wordStream } from './rhythm'

describe('Al compás with words', () => {
  it('the stream plays each word letter by letter, a space between words, never the same word twice in a row', () => {
    const next = wordStream(['sol', 'mar'], makeRng(3))
    const played = Array.from({ length: 24 }, () => next()).join('')
    const words = played.trim().split(' ')
    expect(played.endsWith(' ')).toBe(true)
    for (const w of words) expect(['sol', 'mar']).toContain(w)
    for (let i = 1; i < words.length; i++) expect(words[i]).not.toBe(words[i - 1])
  })

  it('schedule takes the notes from the stream when there is one', () => {
    const next = wordStream(['casa'], makeRng(1))
    const r = schedule(startRound(200), 0, 2000, ['a', 's'], [], makeRng(1), next)
    expect(r.notes.map((n) => n.ch).join('')).toMatch(/^casa casa/)
  })

  it('words are real, 3 to 6 letters, typed with one key each (no tildes, no Shift)', () => {
    const pool = [...'fjdkslañghruei', ' ']
    const words = rhythmWords(LATAM, pool)
    expect(words.length).toBeGreaterThanOrEqual(10)
    for (const w of words) {
      expect(w.length).toBeGreaterThanOrEqual(3)
      expect(w.length).toBeLessThanOrEqual(6)
      expect(w).toMatch(/^[fjdkslañghruei]+$/)
    }
    // too few letters for real words: no word mode
    expect(rhythmWords(LATAM, ['f', 'j', ' '])).toEqual([])
  })
})
