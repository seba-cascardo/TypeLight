import { describe, expect, it } from 'vitest'
import { bumpStreak, daysBetween, starsFor, streakAlive, updateKeyStats, weakestKeys } from './index'

describe('key stats', () => {
  it('creates and smooths per-key stats', () => {
    let stats = updateKeyStats({}, [{ char: 'f', latencies: [400, 600], errors: 1, occurrences: 2 }])
    expect(stats.f).toEqual({ latencyEma: 500, errorEma: 1 / 3, samples: 3 })
    stats = updateKeyStats(stats, [{ char: 'f', latencies: [100], errors: 0, occurrences: 1 }])
    expect(stats.f.latencyEma).toBeCloseTo(400)
    expect(stats.f.errorEma).toBeCloseTo(0.25)
    expect(stats.f.samples).toBe(4)
  })

  it('ranks the weakest keys, treating unknown keys as medium', () => {
    const stats = updateKeyStats({}, [
      { char: 'a', latencies: [200], errors: 0, occurrences: 5 },
      { char: 'b', latencies: [900], errors: 3, occurrences: 5 },
      { char: 'c', latencies: [300], errors: 0, occurrences: 5 },
    ])
    expect(weakestKeys(stats, 'abcd ', 2)).toEqual(['b', 'd'])
  })
})

describe('stars', () => {
  const m = (accuracy: number, wpm: number) => ({ accuracy, wpm, chars: 50, correct: 50, errors: 0, seconds: 10 })
  it('awards stars by accuracy then speed', () => {
    expect(starsFor(m(0.9, 50), 20)).toBe(1)
    expect(starsFor(m(0.96, 5), 20)).toBe(2)
    expect(starsFor(m(0.98, 19), 20)).toBe(2)
    expect(starsFor(m(0.98, 20), 20)).toBe(3)
    expect(starsFor({ ...m(1, 1), chars: 0 }, 20)).toBe(0)
  })
})

describe('streak', () => {
  it('counts consecutive days and resets after a gap', () => {
    let s = bumpStreak({ count: 0, lastDay: null }, '2026-09-15')
    expect(s).toEqual({ count: 1, lastDay: '2026-09-15' })
    s = bumpStreak(s, '2026-09-15')
    expect(s.count).toBe(1)
    s = bumpStreak(s, '2026-09-16')
    expect(s.count).toBe(2)
    s = bumpStreak(s, '2026-09-18')
    expect(s.count).toBe(1)
  })

  it('handles month boundaries', () => {
    expect(daysBetween('2026-09-30', '2026-10-01')).toBe(1)
    expect(streakAlive({ count: 3, lastDay: '2026-09-30' }, '2026-10-01')).toBe(true)
    expect(streakAlive({ count: 3, lastDay: '2026-09-29' }, '2026-10-01')).toBe(false)
  })
})
