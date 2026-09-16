import { describe, expect, it } from 'vitest'
import { createSession, isFinished, keySamples, metrics, rhythm, typeChar, typeText } from './index'

describe('typing session', () => {
  it('advances on correct keys and finishes at the end', () => {
    let s = createSession('fj')
    expect(isFinished(s)).toBe(false)
    s = typeChar(s, 'f', 1000)
    expect(s.pos).toBe(1)
    expect(s.startedAt).toBe(1000)
    s = typeChar(s, 'j', 1500)
    expect(s.pos).toBe(2)
    expect(isFinished(s)).toBe(true)
    expect(s.finishedAt).toBe(1500)
  })

  it('stays on the same position after a wrong key and marks it', () => {
    let s = createSession('fj')
    s = typeChar(s, 'j', 1000)
    expect(s.pos).toBe(0)
    expect(s.lastWrong).toBe(true)
    expect(s.erred[0]).toBe(true)
    s = typeChar(s, 'f', 1200)
    expect(s.pos).toBe(1)
    expect(s.lastWrong).toBe(false)
    expect(s.erred[0]).toBe(true)
  })

  it('ignores input after finishing', () => {
    let s = createSession('a')
    s = typeChar(s, 'a', 10)
    const after = typeChar(s, 'a', 20)
    expect(after).toBe(s)
  })

  it('processes multi-character input sequentially', () => {
    const s = typeText(createSession('abc'), 'abc', 0)
    expect(isFinished(s)).toBe(true)
  })

  it('computes wpm and accuracy', () => {
    // 10 chars in 12 seconds = 2 words / 0.2 min = 10 wpm; one error → 10/11 accuracy
    let s = createSession('abcdefghij')
    let t = 0
    s = typeChar(s, 'x', t)
    for (const ch of 'abcdefghij') {
      s = typeChar(s, ch, t)
      t += 12000 / 9
    }
    const m = metrics(s)
    expect(m.errors).toBe(1)
    expect(m.correct).toBe(10)
    expect(m.accuracy).toBeCloseTo(10 / 11)
    expect(m.wpm).toBe(10)
    expect(m.seconds).toBeCloseTo(12)
  })

  it('caps latency and collects per-key samples', () => {
    let s = createSession('ab')
    s = typeChar(s, 'a', 0)
    s = typeChar(s, 'x', 100) // error on b
    s = typeChar(s, 'b', 5000) // very slow → capped
    const samples = keySamples(s)
    expect(samples.get('a')).toMatchObject({ occurrences: 1, errors: 0, latencies: [] })
    expect(samples.get('b')).toMatchObject({ occurrences: 1, errors: 1, latencies: [2000] })
  })
})

describe('rhythm', () => {
  /** A session of `gaps.length + 1` correct keystrokes separated by the given gaps (ms). */
  const session = (gaps: number[]) => {
    let s = createSession('a'.repeat(gaps.length + 1))
    let t = 1000
    s = typeChar(s, 'a', t)
    for (const g of gaps) {
      t += g
      s = typeChar(s, 'a', t)
    }
    return s
  }

  it('is 1 for perfectly even gaps and lower for uneven ones', () => {
    expect(rhythm(session(Array(8).fill(300)))).toBe(1)
    const uneven = rhythm(session([100, 500, 100, 500, 100, 500, 100, 500]))
    expect(uneven).toBeGreaterThan(0)
    expect(uneven).toBeLessThan(0.5)
  })

  it('needs at least 8 gaps', () => {
    expect(rhythm(session(Array(7).fill(300)))).toBeUndefined()
  })

  it('ignores pauses that hit the latency cap', () => {
    expect(rhythm(session([...Array(8).fill(300), 5000]))).toBe(1)
  })
})
