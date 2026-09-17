import { describe, expect, it } from 'vitest'
import { buildCurriculum } from '../curriculum'
import { LATAM } from '../layouts'
import { SENTENCES } from '../corpus/sentences'
import { GENERATED_SENTENCES } from '../corpus/sentences.generated'
import { adaptiveText, challengeText, drillText, examText, fitSentence, makeRng, ngramText, pickSentences, poolOf, reviewText, sentencesText, wordsText } from './index'

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

  it('pickSentences never repeats a sentence within one call', () => {
    const pool = new Set('abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ.,:;¿?¡!"()-% ')
    const picked = pickSentences(pool, 10, { rng: makeRng(11) })
    expect(picked).toHaveLength(10)
    expect(new Set(picked).size).toBe(10)
  })

  it('challengeText reaches the minimum length with distinct sentences, or words when none fit', () => {
    const full = new Set('abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ.,:;¿?¡!"()-% ')
    const t = challengeText(full, { rng: makeRng(12) })
    expect(t.length).toBeGreaterThanOrEqual(420)
    const sentences = t.split(/(?<=[.?!]) /)
    expect(new Set(sentences).size).toBe(sentences.length)
    const fj = challengeText(poolOf('fj'), { rng: makeRng(13) })
    expect(only(fj, 'fj ')).toBe(true)
    expect(fj.length).toBeGreaterThanOrEqual(420)
  })

  it('examText is fixed for a month and long enough for three minutes', () => {
    const full = new Set('abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ.,:;¿?¡!"()-% ')
    const a = examText(full, '2026-09')
    expect(a).toBe(examText(full, '2026-09'))
    expect(a).not.toBe(examText(full, '2026-10'))
    expect(a.length).toBeGreaterThanOrEqual(1500)
    const sentences = a.split(/(?<=[.?!]) /)
    expect(new Set(sentences).size).toBe(sentences.length)
    const fj = examText(poolOf('fj'), '2026-09')
    expect(only(fj, 'fj ')).toBe(true)
    expect(fj.length).toBeGreaterThanOrEqual(1500)
  })

  it('challengeText tops up with words when the sentences that fit fall short of minChars', () => {
    const full = new Set('abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ.,:;¿?¡!"()-% ')
    const t = challengeText(full, { minChars: 1200, rng: makeRng(14) })
    expect(t.length).toBeGreaterThanOrEqual(1200)
    // the twelve distinct sentences (~750 chars) came first…
    expect((t.match(/[.?!]/g) ?? []).length).toBeGreaterThanOrEqual(12)
    // …and word runs filled the rest: the last chunk is not a sentence
    expect(/[.?!]$/.test(t)).toBe(false)
  })

  it('challengeText never returns fewer than minChars when sentences suffice', () => {
    const full = new Set('abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ.,:;¿?¡!"()-% ')
    for (let seed = 0; seed < 25; seed++) {
      for (const min of [100, 200, 300, 420]) expect(challengeText(full, { minChars: min, rng: makeRng(seed) }).length).toBeGreaterThanOrEqual(min)
    }
  })

  it('fitSentence lowers and strips only the punctuation the pool lacks; accents are never touched', () => {
    const lower = poolOf('abcdefghijklmnopqrstuvwxyzñ')
    expect(fitSentence('El pulpo tiene tres corazones.', lower)).toBe('el pulpo tiene tres corazones')
    expect(fitSentence('¿Cuántos años tenés?', lower)).toBeNull() // accents cannot be dropped
    const withDot = poolOf('abcdefghijklmnopqrstuvwxyzñ.')
    expect(fitSentence('¿Hay pan? Hay, y mucho.', withDot)).toBe('hay pan hay y mucho.')
    const caps = new Set('abcdefghijklmnopqrstuvwxyzñABCDEFGHIJKLMNOPQRSTUVWXYZÑ. ')
    expect(fitSentence('Hoy es lunes.', caps)).toBe('Hoy es lunes.')
  })

  it('offers plenty of real sentences at every stage of the LATAM path', () => {
    const c = buildCurriculum(LATAM)
    const poolAt = (id: string) => poolOf(c.byId.get(id)!.pool)
    const countAt = (id: string) => pickSentences(poolAt(id), 5000, { rng: makeRng(1) }).length
    expect(countAt('inferior-unit-review')).toBeGreaterThanOrEqual(300)
    expect(countAt('mayusculas-unit-review')).toBeGreaterThanOrEqual(300)
    expect(countAt('acentos-unit-review')).toBeGreaterThanOrEqual(1000)
  })

  it('weights the house sentences three to one over generated ones', () => {
    const full = new Set('abcdefghijklmnopqrstuvwxyzáéíóúüñABCDEFGHIJKLMNOPQRSTUVWXYZÁÉÍÓÚÑ.,:;¿?¡!"()-% ')
    let house = 0
    const generated = new Set(GENERATED_SENTENCES)
    for (let seed = 0; seed < 200; seed++) for (const s of pickSentences(full, 1, { rng: makeRng(seed) })) if (!generated.has(s)) house++
    // ~184 house vs ~1500 generated at weight 3:1 → roughly 27 % house; well above the unweighted 11 %.
    expect(house).toBeGreaterThan(35)
  })

  it('has no duplicate house sentences', () => {
    expect(new Set(SENTENCES).size).toBe(SENTENCES.length)
  })

  it('ngramText repeats the chosen n-grams consecutively, inside the pool, and leans on weak keys', () => {
    const pool = poolOf('abcdefghijklmnopqrstuvwxyzñ')
    const t = ngramText(pool, 2, { combination: 3, repetition: 3, tokens: 15, rng: makeRng(21) })
    expect(only(t, pool)).toBe(true)
    const tokens = t.split(' ')
    expect(tokens).toHaveLength(15)
    // pattern: g1 g2 g3 g1 g2 g3 g1 g2 g3 word g1 g2 g3 g1 g2
    const [g1, g2, g3] = tokens
    expect([g1, g2, g3].every((g) => g.length === 2)).toBe(true)
    expect(new Set([g1, g2, g3]).size).toBe(3)
    expect(tokens.slice(0, 9)).toEqual([g1, g2, g3, g1, g2, g3, g1, g2, g3])
    expect([g1, g2, g3].some((g) => tokens[9].includes(g))).toBe(true) // a real word carrying one of them
    expect(tokens.slice(10)).toEqual([g1, g2, g3, g1, g2])
    const tri = ngramText(pool, 3, { tokens: 12, rng: makeRng(23) })
    expect(tri.split(' ')[0]).toHaveLength(3)
  })

  it('ngramText leans on the weak keys', () => {
    const pool = poolOf('abcdefghijklmnopqrstuvwxyzñ')
    const rare = /[xzwkj]/
    let withWeak = 0
    let without = 0
    for (let seed = 0; seed < 40; seed++) {
      if (rare.test(ngramText(pool, 2, { weak: ['x', 'z', 'w', 'k', 'j'], tokens: 9, rng: makeRng(seed) }))) withWeak++
      if (rare.test(ngramText(pool, 2, { tokens: 9, rng: makeRng(seed) }))) without++
    }
    expect(withWeak).toBeGreaterThan(without)
  })

  it('ngramText falls back to words when the pool fits fewer than six n-grams', () => {
    const t = ngramText(poolOf('fj'), 2, { rng: makeRng(24) })
    expect(only(t, 'fj ')).toBe(true)
  })

  it('ngramText stays total for degenerate options', () => {
    const pool = poolOf('abcdefghijklmnopqrstuvwxyzñ')
    expect(ngramText(pool, 2, { combination: 0, tokens: 6, rng: makeRng(31) }).split(' ')).toHaveLength(6)
    expect(ngramText(pool, 2, { tokens: 0, rng: makeRng(32) })).toBe('')
    expect(ngramText(pool, 2, { repetition: 0, tokens: 6, rng: makeRng(33) }).split(' ')).toHaveLength(6)
  })
})
