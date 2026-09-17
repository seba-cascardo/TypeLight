import { describe, expect, it } from 'vitest'
import { LATAM, US } from '../layouts'
import { backspace, cleanRun, createSession, typeChar, typeText } from '../typing'
import { ghostWpm30, prepareOwnText, seedOf } from './extras'
import type { Days } from './days'

describe('own text', () => {
  it('normalises whitespace and typographic punctuation and drops what the layout cannot type', () => {
    const t = prepareOwnText('Hola,\n\n “mundo” — ¿qué tal?  Bien…\tGracias ☺', LATAM)
    expect(t).toBe('Hola, "mundo" - ¿qué tal? Bien... Gracias')
    expect(prepareOwnText('ñandú', US)).toBe('and')
    expect(prepareOwnText('   ', LATAM)).toBe('')
    expect(prepareOwnText('a'.repeat(2000), LATAM)).toHaveLength(1500)
  })

  it('seedOf is stable', () => {
    expect(seedOf('2026-09-18')).toBe(seedOf('2026-09-18'))
    expect(seedOf('2026-09-18')).not.toBe(seedOf('2026-09-19'))
  })
})

describe('clean run', () => {
  it('is the longest run of correct attempts; backspaces do not break it', () => {
    expect(cleanRun(typeText(createSession('abcdef'), 'abxcdef', 0))).toBe(4)
    expect(cleanRun(typeText(createSession('abc'), 'abc', 0))).toBe(3)
    expect(cleanRun(createSession('abc'))).toBe(0)
    let f = createSession('abc', 'free')
    f = typeChar(f, 'a', 0)
    f = typeChar(f, 'x', 10)
    f = backspace(f, 20)
    f = typeChar(f, 'b', 30)
    f = typeChar(f, 'c', 40)
    expect(cleanRun(f)).toBe(2)
  })
})

describe('ghost of 30 days ago', () => {
  it('is the median reference of the days 30 to 36 days back, or null', () => {
    const row = (reference: number[]): Days[string] => ({ seconds: 60, blocks: 4, learned: 8, mastered: 2, reference, sessions: 1 })
    const days: Days = { '2026-08-19': row([20, 24]), '2026-08-14': row([30]), '2026-08-12': row([40]), '2026-09-17': row([50]) }
    expect(ghostWpm30(days, '2026-09-18')).toBe(24) // 08-19 (gap 30) and 08-14 (gap 35): 20, 24, 30 → 24
    expect(ghostWpm30(days, '2026-11-01')).toBeNull()
  })
})
