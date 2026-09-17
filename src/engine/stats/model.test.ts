import { describe, expect, it } from 'vitest'
import { LATAM } from '../layouts'
import { bigramClass, bigramClasses, updateBigramStats, weakestBigrams, type BigramStats } from './bigrams'
import { forecast } from './forecast'
import { weaknessQualities } from './qualities'
import { updateWordStats, weakestWords, MAX_WORDS, type WordStats } from './words'

describe('bigram stats', () => {
  it('folds samples with the weighted step and classifies by hands and fingers', () => {
    let b: BigramStats = {}
    b = updateBigramStats(b, [{ bigram: 'ca', latencies: [300, 500], errors: 1 }])
    expect(b.ca).toEqual({ latencyEma: 400, errorEma: 1 / 3, samples: 3 })
    b = updateBigramStats(b, [{ bigram: 'ca', latencies: [100], errors: 0 }])
    expect(b.ca.samples).toBe(4)
    expect(b.ca.latencyEma).toBeCloseTo(325)
    // LATAM: c = left middle, a = left pinky → same hand; ff → repeat; fr → same finger (index); fj → alternating
    expect(bigramClass(LATAM, 'ca')).toBe('hand')
    expect(bigramClass(LATAM, 'ff')).toBe('repeat')
    expect(bigramClass(LATAM, 'fr')).toBe('finger')
    expect(bigramClass(LATAM, 'fj')).toBe('alt')
    expect(bigramClass(LATAM, 'f ')).toBeNull()
  })

  it('keeps at most 600 bigrams, dropping the least sampled', () => {
    let b: BigramStats = {}
    const samples = Array.from({ length: 700 }, (_, i) => ({ bigram: `b${i}`, latencies: [300], errors: 0 }))
    b = updateBigramStats(b, samples)
    expect(Object.keys(b).length).toBeLessThanOrEqual(600)
    // ties drop the oldest entries first
    expect(b.b0).toBeUndefined()
    b = updateBigramStats(b, [{ bigram: 'b650', latencies: [300, 300], errors: 0 }])
    expect(b.b650.samples).toBe(3)
  })

  it('averages by class and finds the weakest typeable bigrams', () => {
    const b: BigramStats = {
      fj: { latencyEma: 200, errorEma: 0, samples: 20 },
      jf: { latencyEma: 220, errorEma: 0, samples: 20 },
      fr: { latencyEma: 400, errorEma: 0.1, samples: 20 },
      ff: { latencyEma: 350, errorEma: 0, samples: 20 },
      ca: { latencyEma: 300, errorEma: 0, samples: 20 },
      qz: { latencyEma: 900, errorEma: 0.5, samples: 2 }, // too few samples
    }
    const classes = bigramClasses(b, LATAM)
    expect(classes.alt).toEqual({ latency: 210, samples: 40 })
    expect(classes.finger).toEqual({ latency: 400, samples: 20 })
    expect(classes.repeat).toEqual({ latency: 350, samples: 20 })
    expect(classes.hand).toEqual({ latency: 300, samples: 20 })
    expect(weakestBigrams(b, new Set('fjrcaqz '), 2)).toEqual(['fr', 'ff'])
    expect(weakestBigrams(b, new Set('fj '), 2)).toEqual(['ff', 'jf'])
  })
})

describe('word stats', () => {
  it('folds samples, stamps the day and ranks the weakest', () => {
    let w: WordStats = {}
    w = updateWordStats(w, [{ word: 'casa', latency: 300, errors: 0 }, { word: 'zapatilla', latency: 600, errors: 2 }], '2026-09-18')
    expect(w.casa).toEqual({ latencyEma: 300, errorEma: 0, samples: 1, lastSeen: '2026-09-18' })
    w = updateWordStats(w, [{ word: 'casa', latency: 500, errors: 1 }, { word: 'zapatilla', latency: null, errors: 0 }], '2026-09-19')
    expect(w.casa.samples).toBe(2)
    expect(w.casa.latencyEma).toBeCloseTo(400)
    expect(w.casa.errorEma).toBeCloseTo(0.5)
    expect(w.zapatilla.latencyEma).toBe(600)
    expect(w.zapatilla.samples).toBe(2)
    expect(weakestWords(w, 2)).toEqual(['zapatilla', 'casa'])
    expect(weakestWords({ solo: { latencyEma: 900, errorEma: 1, samples: 1, lastSeen: 'x' } }, 2)).toEqual([])
  })

  it('keeps at most 400 words, dropping the least seen', () => {
    let w: WordStats = {}
    w = updateWordStats(w, Array.from({ length: MAX_WORDS + 50 }, (_, i) => ({ word: `w${i}`, latency: 300, errors: 0 })), '2026-09-18')
    expect(Object.keys(w).length).toBeLessThanOrEqual(MAX_WORDS)
  })
})

describe('weakness qualities', () => {
  const key = (latencyEma: number, errorEma = 0) => ({ latencyEma, errorEma, samples: 20, halfLife: 3, daysSeen: 3 })
  it('names the slow hand, row, same-finger transitions, doubles and dead keys', () => {
    const keys = { f: key(300), j: key(500), d: key(300), k: key(520), e: key(600), i: key(600), á: key(900), a: key(300) }
    const bigrams: BigramStats = { fj: { latencyEma: 200, errorEma: 0, samples: 20 }, fr: { latencyEma: 500, errorEma: 0, samples: 20 }, ff: { latencyEma: 200, errorEma: 0, samples: 20 } }
    const q = weaknessQualities(keys, bigrams, LATAM, ['f', 'j', 'd', 'k', 'e', 'i', 'á', 'a'])
    expect(q).toEqual(['mano derecha', 'fila superior'])
    expect(weaknessQualities({ f: key(300), j: key(300) }, bigrams, LATAM, ['f', 'j'])).toEqual(['mismo dedo'])
    expect(weaknessQualities({}, {}, LATAM, [])).toEqual([])
  })
})

describe('forecast', () => {
  const points = (wpms: number[]) => wpms.map((wpm, i) => ({ day: `2026-09-${String(i + 1).padStart(2, '0')}`, wpm, n: 1 }))
  it('extrapolates a clear upward trend to the goal, in calendar days from today', () => {
    const f = forecast(points([20, 21, 22, 23, 24, 25, 26, 27, 28, 29]), 40, '2026-09-10')
    expect(f).toMatchObject({ reached: false, r2: 1 })
    expect(f && 'daysToGoal' in f ? f.daysToGoal : null).toBe(11)
  })
  it('says so when the goal is already met, and stays quiet without a trend', () => {
    expect(forecast(points([40, 41, 42, 43, 44, 45, 46, 47]), 40, '2026-09-08')).toEqual({ reached: true })
    expect(forecast(points([20, 30, 20, 30, 20, 30, 20, 30]), 40, '2026-09-08')).toBeNull()
    expect(forecast(points([20, 21, 22]), 40, '2026-09-03')).toBeNull()
    expect(forecast(points([30, 29, 28, 27, 26, 25, 24, 23]), 40, '2026-09-08')).toBeNull()
  })
})
