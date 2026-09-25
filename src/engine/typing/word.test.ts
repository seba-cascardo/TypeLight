import { describe, expect, it } from 'vitest'
import { backspace, createSession, keySamples, metrics, repairMetrics, typeText } from './index'

const type = (text: string, typed: string) => typeText(createSession(text, 'word'), typed, 1000)

describe('word mode ("stop on word", the reading mode)', () => {
  it('lets an error pass inside the word, like free mode', () => {
    const s = type('casa azul', 'cxs')
    expect(s.pos).toBe(3)
    expect(s.typed).toEqual(['c', 'x', 's'])
    expect(s.erred[1]).toBe(true)
  })

  it('refuses the space while the word has an error, without counting it against the space bar', () => {
    const s = type('casa azul', 'cxsa ')
    expect(s.pos).toBe(4)
    expect(s.lastWrong).toBe(true)
    expect(metrics(s).errors).toBe(1)
    expect(keySamples(s).get(' ')).toBeUndefined()
  })

  it('after the Backspace repair, the space moves on', () => {
    let s = type('casa azul', 'cxsa')
    for (let i = 0; i < 3; i++) s = backspace(s, 1100)
    s = typeText(s, 'asa a', 1200)
    expect(s.pos).toBe(6)
    expect(s.typed.join('')).toBe('casa a')
  })

  it('an extra letter at the end of the word also holds the space until removed', () => {
    let s = type('casa azul', 'casas ')
    expect(s.pos).toBe(4)
    expect(s.extras[4]).toBe('s')
    s = backspace(s, 1100)
    s = typeText(s, ' ', 1200)
    expect(s.pos).toBe(5)
  })

  it('a space in the middle of a word is an error that passes, not a skip', () => {
    const s = type('casa azul', 'ca ')
    expect(s.pos).toBe(3)
    expect(s.typed).toEqual(['c', 'a', ' '])
    expect(s.erred[2]).toBe(true)
  })

  it('does not finish with the last word wrong; it does once repaired', () => {
    let s = type('sol', 'sxl')
    expect(s.pos).toBe(3)
    expect(s.finishedAt).toBeNull()
    s = typeText(s, 'l', 1100)
    expect(s.pos).toBe(3)
    s = backspace(backspace(s, 1200), 1200)
    s = typeText(s, 'ol', 1300)
    expect(s.finishedAt).toBe(1300)
    expect(metrics(s).correct).toBe(3)
    expect(repairMetrics(s)?.repaired).toBe(1)
  })
})
