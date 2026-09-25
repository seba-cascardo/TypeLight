import { describe, expect, it } from 'vitest'
import { CODE } from '../corpus/code'
import { ES, LATAM, US, canType } from '../layouts'
import { codeText, makeRng, numpadText, poolOf } from './index'

const typeable = (layout: typeof US) => poolOf(CODE.flatMap((l) => [...l.text]).filter((c) => canType(layout, c)))

describe('code corpus', () => {
  it('is plain ASCII, one space between tokens, no indentation', () => {
    for (const { text } of CODE) {
      expect(text, text).toMatch(/^[\x21-\x7e][\x20-\x7e]*[\x21-\x7e]$/)
      expect(text, text).not.toContain('  ')
    }
  })

  it('has lines of every language for every layout', () => {
    for (const layout of [US, ES, LATAM]) {
      const pool = typeable(layout)
      for (const lang of ['js', 'py', 'sh', 'sql', 'web'] as const) {
        const fit = CODE.filter((l) => l.lang === lang && [...l.text].every((c) => pool.has(c)))
        expect(fit.length, `${layout.id} ${lang}`).toBeGreaterThanOrEqual(5)
      }
    }
  })
})

describe('codeText', () => {
  const pool = typeable(LATAM)

  it('only uses lines the pool can type, joined by one space', () => {
    const noBrackets = new Set([...pool].filter((c) => c !== '[' && c !== ']'))
    for (let seed = 1; seed < 30; seed++) {
      const t = codeText(noBrackets, 4, { rng: makeRng(seed) })
      expect(t).not.toMatch(/[[\]]/)
      expect(t).not.toContain('  ')
    }
  })

  it('leans on the focus symbols and can stick to some languages', () => {
    let withBrace = 0
    for (let seed = 1; seed <= 20; seed++) {
      const t = codeText(pool, 4, { rng: makeRng(seed), focus: ['{', '}'], langs: ['js'] })
      const lines = CODE.filter((l) => t.includes(l.text))
      expect(lines.every((l) => l.lang === 'js')).toBe(true)
      if (t.includes('{')) withBrace++
    }
    expect(withBrace).toBe(20)
  })

  it('falls back to a symbols drill when no line fits', () => {
    const t = codeText(poolOf([...'asdfghjklñ', '{', '}']), 4, { rng: makeRng(3), focus: ['{', '}'] })
    expect(t.length).toBeGreaterThan(5)
    expect([...t].every((c) => 'asdfghjklñ{} '.includes(c)), t).toBe(true)
    expect(t).toContain('{')
  })
})

describe('numpadText', () => {
  it('uses only the given keys, groups of digits, and short sums that never start with an operator', () => {
    for (let seed = 1; seed < 40; seed++) {
      const t = numpadText(['4', '5', '6', '+', '-'], 14, { rng: makeRng(seed) })
      expect([...t].every((c) => '456+- '.includes(c)), t).toBe(true)
      for (const token of t.split(' ')) {
        expect(token, t).toMatch(/^[0-9]/)
        expect(token, t).toMatch(/[0-9]$/)
      }
    }
  })

  it('digits only when no operator was taught yet', () => {
    const t = numpadText(['7', '8', '9'], 10, { rng: makeRng(5) })
    expect(t.split(' ')).toHaveLength(10)
    expect(t).toMatch(/^[789 ]+$/)
  })
})
