import { describe, expect, it } from 'vitest'
import { backspace, bigramSamples, createSession, deadKeyStats, typeChar, typeText, wordSamples } from './index'

/** Type `text` against `target` with a fixed gap between keys, from t = 0. */
function run(target: string, text: string, gap = 200, mode: 'stop' | 'free' = 'stop') {
  let s = createSession(target, mode)
  let t = 0
  for (const ch of text) {
    s = typeChar(s, ch, t)
    t += gap
  }
  return s
}

describe('bigram samples', () => {
  it('collects the latency of each in-word bigram whose two keys were right, and errors on the second key', () => {
    // "casa da": c a s a _ d a; the wrong 'x' before the 's' is an error for "as"
    let s = createSession('casa da')
    const seq: [string, number][] = [['c', 0], ['a', 200], ['x', 400], ['s', 500], ['a', 700], [' ', 900], ['d', 1100], ['a', 1300]]
    for (const [ch, t] of seq) s = typeChar(s, ch, t)
    const b = bigramSamples(s)
    expect(b.get('ca')).toEqual({ bigram: 'ca', latencies: [200], errors: 0 })
    // after the error the 's' latency counts from the wrong key: not a clean transition, so no latency, one error
    expect(b.get('as')).toEqual({ bigram: 'as', latencies: [], errors: 1 })
    expect(b.get('sa')).toEqual({ bigram: 'sa', latencies: [200], errors: 0 })
    expect(b.get('da')).toEqual({ bigram: 'da', latencies: [200], errors: 0 })
    expect(b.has('a ')).toBe(false)
    expect(b.has(' d')).toBe(false)
  })

  it('ignores backspaces and pauses', () => {
    let s = run('ab', 'ab', 3000, 'free')
    expect(bigramSamples(s).get('ab')?.latencies).toEqual([])
    s = createSession('ab', 'free')
    s = typeChar(s, 'x', 0)
    s = backspace(s, 100)
    s = typeChar(s, 'a', 200)
    s = typeChar(s, 'b', 400)
    expect(bigramSamples(s).get('ab')).toEqual({ bigram: 'ab', latencies: [200], errors: 0 })
  })
})

describe('word samples', () => {
  it('measures each word of three letters or more: mean latency per letter after the first, and errors', () => {
    const s = run('la casa roja', 'la casa roja', 150)
    const w = wordSamples(s)
    expect(w.has('la')).toBe(false)
    expect(w.get('casa')).toEqual({ word: 'casa', latency: 150, errors: 0 })
    expect(w.get('roja')).toEqual({ word: 'roja', latency: 150, errors: 0 })
  })

  it('counts errors inside the word and strips punctuation', () => {
    let s = createSession('¡hola, mundo!')
    const seq: [string, number][] = [['¡', 0], ['h', 100], ['o', 200], ['l', 300], ['a', 400], [',', 500], [' ', 600], ['m', 700], ['x', 800], ['u', 900], ['n', 1000], ['d', 1100], ['o', 1200], ['!', 1300]]
    for (const [ch, t] of seq) s = typeChar(s, ch, t)
    const w = wordSamples(s)
    expect(w.get('hola')).toEqual({ word: 'hola', latency: 100, errors: 0 })
    expect(w.get('mundo')?.errors).toBe(1)
    expect(w.get('mundo')?.latency).toBe(100)
  })

  it('skipped words in free mode are counted as errors, not measured', () => {
    let s = createSession('casa roja', 'free')
    s = typeChar(s, 'c', 0)
    s = typeChar(s, ' ', 100)
    s = typeText(s, 'roja', 200)
    expect(wordSamples(s).get('casa')).toEqual({ word: 'casa', latency: null, errors: 1 })
  })
})

describe('dead-key stats', () => {
  it('counts accented hits with their latency, missed accents and loose accents', () => {
    let s = createSession('está así ya', 'free')
    const seq: [string, number][] = [
      ['e', 0], ['s', 200], ['t', 400], ['a', 600], // 'a' for 'á': missed accent (free mode: it passes)
      [' ', 800], ['a', 1000], ['s', 1200], ['í', 1600], // accented hit, 400 ms
      [' ', 1800], ['á', 2000], // accented for a plain letter: loose
    ]
    for (const [ch, t] of seq) s = typeChar(s, ch, t)
    const d = deadKeyStats(s)
    expect(d).toEqual({ n: 1, latency: 400, missed: 1, loose: 1 })
  })

  it('a bare acute typed where an accented vowel was expected is a loose accent', () => {
    let s = createSession('á')
    s = typeChar(s, '´', 0)
    s = typeChar(s, 'á', 300)
    expect(deadKeyStats(s)).toEqual({ n: 1, latency: 300, missed: 0, loose: 1 })
  })

  it('is null without any accented character involved', () => {
    expect(deadKeyStats(run('casa', 'casa'))).toBeNull()
  })
})
