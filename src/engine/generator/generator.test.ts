import { describe, expect, it } from 'vitest'
import { adaptiveText, drillText, makeRng, poolOf, reviewText, sentencesText, wordsText } from './index'

const only = (text: string, allowed: Iterable<string>) => {
  const set = new Set(allowed)
  return [...text].every((c) => set.has(c))
}

describe('generators', () => {
  it('drill uses only the new keys and spaces, starting with repetitions', () => {
    const t = drillText(['f', 'j'], 14, { rng: makeRng(1) })
    expect(t.startsWith('fff jjj fff jjj')).toBe(true)
    expect(only(t, 'fj ')).toBe(true)
    expect(t.split(' ').length).toBeGreaterThanOrEqual(14)
  })

  it('review uses only the pool and includes new keys', () => {
    const pool = poolOf('fjdk')
    const t = reviewText(['d', 'k'], pool, 14, { rng: makeRng(2) })
    expect(only(t, pool)).toBe(true)
    expect(t).toMatch(/[dk]/)
  })

  it('words falls back to pseudo-words when few real words fit', () => {
    const pool = poolOf('fj')
    const t = wordsText(pool, 10, { rng: makeRng(3) })
    expect(only(t, pool)).toBe(true)
    expect(t.split(' ')).toHaveLength(10)
  })

  it('words uses real Spanish words once enough keys are known', () => {
    const pool = poolOf('asdfghjklñeiruo')
    const t = wordsText(pool, 14, { rng: makeRng(4) })
    expect(only(t, pool)).toBe(true)
    const words = t.split(' ')
    // With 15 letters known, the generator should be drawing from the real corpus.
    expect(words.filter((w) => w.length >= 3).length).toBeGreaterThanOrEqual(8)
    expect(new Set(words).size).toBeGreaterThanOrEqual(8)
  })

  it('words biases towards focus keys', () => {
    const pool = poolOf('abcdefghijklmnopqrstuvwxyzñ')
    const t = wordsText(pool, 40, { focus: ['z'], rng: makeRng(5) })
    const withZ = t.split(' ').filter((w) => w.includes('z')).length
    expect(withZ).toBeGreaterThanOrEqual(10)
  })

  it('sentences returns only fitting sentences or empty string', () => {
    expect(sentencesText(poolOf('fj'), 2)).toBe('')
    const pool = new Set('abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ.,:;¿?¡!"()-% ')
    const t = sentencesText(pool, 2, { rng: makeRng(6) })
    expect(t.length).toBeGreaterThan(20)
    expect(only(t, pool)).toBe(true)
  })

  it('adaptive text concentrates on weak keys', () => {
    const pool = poolOf('abcdefghijklmnopqrstuvwxyzñ')
    const t = adaptiveText(pool, ['q', 'x'], 20, { rng: makeRng(7) })
    expect(only(t, pool)).toBe(true)
    const hits = t.split(' ').filter((w) => /[qx]/.test(w)).length
    expect(hits).toBeGreaterThanOrEqual(12)
  })

  it('is deterministic for a given seed', () => {
    const pool = poolOf('asdfjklñ')
    expect(wordsText(pool, 10, { rng: makeRng(9) })).toBe(wordsText(pool, 10, { rng: makeRng(9) }))
  })
})
