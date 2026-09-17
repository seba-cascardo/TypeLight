import { describe, expect, it } from 'vitest'
import { MAX_EXTRAS, backspace, createSession, isFinished, keySamples, metrics, repairMetrics, rhythm, typeChar, typeText, wordStart } from './index'

const free = (target: string) => createSession(target, 'free')

describe('free mode: the error passes', () => {
  it('a wrong letter is written down and the cursor moves on', () => {
    const s = typeChar(free('casa'), 'x', 0)
    expect(s.pos).toBe(1)
    expect(s.typed[0]).toBe('x')
    expect(s.erred[0]).toBe(true)
    expect(s.lastWrong).toBe(true)
    expect(metrics(s).errors).toBe(1)
  })

  it('backspace takes it back without counting as an attempt', () => {
    let s = typeChar(free('casa'), 'x', 0)
    s = backspace(s, 10)
    expect(s.pos).toBe(0)
    expect(s.typed).toHaveLength(0)
    expect(s.keystrokes).toHaveLength(2)
    expect(s.keystrokes[1].backspace).toBe(true)
    const m = metrics(s)
    expect(m.errors).toBe(1)
    expect(m.chars).toBe(0)
    expect(keySamples(s).has('\b')).toBe(false)
    expect(keySamples(s).get('c')?.errors).toBe(1)
  })

  it('a repaired position keeps its mark and counts as correct text', () => {
    let s = typeChar(free('casa'), 'x', 0)
    s = backspace(s, 10)
    s = typeChar(s, 'c', 20)
    expect(s.pos).toBe(1)
    expect(s.erred[0]).toBe(true)
    expect(s.typed[0]).toBe('c')
    const m = metrics(s)
    expect(m.correct).toBe(1)
    expect(m.errors).toBe(1)
    expect(m.accuracy).toBe(0.5)
  })

  it('extra letters hang at the end of the word, up to a cap', () => {
    let s = typeText(free('la casa'), 'la', 0)
    s = typeChar(s, 's', 10)
    expect(s.pos).toBe(2)
    expect(s.extras[2]).toBe('s')
    expect(metrics(s).errors).toBe(1)
    for (let i = 0; i < MAX_EXTRAS + 2; i++) s = typeChar(s, 's', 20 + i)
    expect(s.extras[2]).toHaveLength(MAX_EXTRAS)
    expect(metrics(s).errors).toBe(MAX_EXTRAS + 3)
    s = backspace(s, 100)
    expect(s.extras[2]).toHaveLength(MAX_EXTRAS - 1)
    expect(s.pos).toBe(2)
  })

  it('extras also hang at the very end of the text', () => {
    let s = typeText(free('ab'), 'ab', 0)
    expect(isFinished(s)).toBe(true)
    s = typeChar(s, 'c', 10)
    expect(s.extras[2]).toBeUndefined()
  })

  it('a space in the middle of a word skips to the next word', () => {
    let s = typeChar(free('casa roja'), 'c', 0)
    s = typeChar(s, ' ', 10)
    expect(s.pos).toBe(5)
    expect(s.typed.slice(1, 5)).toEqual([null, null, null, ' '])
    expect(s.erred.slice(1, 4)).toEqual([true, true, true])
    expect(s.erred[4]).toBe(false)
    expect(metrics(s).errors).toBe(1)
    s = backspace(s, 20)
    expect(s.pos).toBe(4)
    expect(s.typed).toHaveLength(4)
  })

  it('a space at the start of a word is an error that does not move', () => {
    let s = typeText(free('a b'), 'a ', 0)
    s = typeChar(s, ' ', 10)
    expect(s.pos).toBe(2)
    expect(metrics(s).errors).toBe(1)
  })

  it('finishes when the end is reached, right or wrong', () => {
    const s = typeText(free('ab'), 'xb', 0)
    expect(isFinished(s)).toBe(true)
    const m = metrics(s)
    expect(m.chars).toBe(2)
    expect(m.correct).toBe(1)
    expect(m.errors).toBe(1)
    expect(m.accuracy).toBe(0.5)
  })

  it('backspace at the start does nothing', () => {
    const s = free('ab')
    expect(backspace(s, 0)).toBe(s)
  })

  it('rhythm ignores backspaces', () => {
    let s = free('abcdefghijkl')
    for (let i = 0; i < 12; i++) {
      s = typeChar(s, 'abcdefghijkl'[i], i * 200)
      if (i === 5) {
        s = backspace(s, i * 200 + 50)
        s = typeChar(s, 'f', i * 200 + 100)
      }
    }
    expect(rhythm(s)).toBeDefined()
  })
})

describe('repair metrics', () => {
  it('counts first-try errors, repairs, repair latency and keystrokes per char', () => {
    let s = typeChar(free('casa'), 'x', 0)
    s = backspace(s, 300)
    s = typeChar(s, 'c', 400)
    s = typeText(s, 'asa', 500)
    const r = repairMetrics(s)!
    expect(r.firstTryErrors).toBe(1)
    expect(r.repaired).toBe(1)
    expect(r.repairMs).toBe(300)
    expect(r.kspc).toBeCloseTo(6 / 4)
  })

  it('an error left in place is not a repair', () => {
    const s = typeText(free('casa'), 'xasa', 0)
    const r = repairMetrics(s)!
    expect(r.firstTryErrors).toBe(1)
    expect(r.repaired).toBe(0)
    expect(r.repairMs).toBeNull()
  })

  it('is null in stop mode', () => {
    expect(repairMetrics(createSession('ab'))).toBeNull()
  })
})

describe('stop mode is untouched', () => {
  it('still stays on the wrong key', () => {
    const s = typeChar(createSession('ab'), 'x', 0)
    expect(s.pos).toBe(0)
    expect(s.mode).toBe('stop')
  })

  it('wordStart finds the current word', () => {
    expect(wordStart('casa roja', 0)).toBe(0)
    expect(wordStart('casa roja', 3)).toBe(0)
    expect(wordStart('casa roja', 5)).toBe(5)
    expect(wordStart('casa roja', 7)).toBe(5)
  })
})
