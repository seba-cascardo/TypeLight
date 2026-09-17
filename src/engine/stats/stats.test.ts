import { describe, expect, it } from 'vitest'
import { FREEZE_EVERY, MAX_FREEZES, bumpStreak, daysBetween, emptyStreak, starsFor, streakAlive, streakAtRisk, streakGap, updateKeyStats, weakestKeys, weaknessScore } from './index'

describe('key stats', () => {
  it('creates per-key stats and smooths them with a sample-weighted step (floor 0.05, cap 0.5)', () => {
    let stats = updateKeyStats({}, [{ char: 'f', latencies: [400, 600], errors: 1, occurrences: 2 }])
    expect(stats.f).toEqual({ latencyEma: 500, errorEma: 1 / 3, samples: 3, halfLife: 3, daysSeen: 0 })
    // 1 new attempt over 3 old ones → step 0.25 (above the floor)
    stats = updateKeyStats(stats, [{ char: 'f', latencies: [100], errors: 0, occurrences: 1 }])
    expect(stats.f.latencyEma).toBeCloseTo(400)
    expect(stats.f.errorEma).toBeCloseTo(0.25)
    expect(stats.f.samples).toBe(4)
    // 4 new over 4 old → capped at 0.5
    stats = updateKeyStats(stats, [{ char: 'f', latencies: [800, 800, 800, 800], errors: 0, occurrences: 4 }])
    expect(stats.f.latencyEma).toBeCloseTo(600)
    // one error among a hundred samples barely moves the error rate
    const many = updateKeyStats({ x: { latencyEma: 300, errorEma: 0, samples: 100, halfLife: 3, daysSeen: 5 } }, [{ char: 'x', latencies: [], errors: 1, occurrences: 0 }])
    expect(many.x.errorEma).toBeCloseTo(0.05) // floor 0.05 × 1: still "on track", not weak
    const manyClean = updateKeyStats({ x: { latencyEma: 300, errorEma: 0.2, samples: 100, halfLife: 3, daysSeen: 5 } }, [{ char: 'x', latencies: [300], errors: 0, occurrences: 1 }])
    expect(manyClean.x.errorEma).toBeCloseTo(0.19)
  })

  it('half-life grows with clean sessions and halves on errors; daysSeen counts distinct days', () => {
    let stats = updateKeyStats({}, [{ char: 'f', latencies: [400, 400, 400], errors: 0, occurrences: 3 }], '2026-09-18')
    expect(stats.f.halfLife).toBe(4.5)
    expect(stats.f.daysSeen).toBe(1)
    stats = updateKeyStats(stats, [{ char: 'f', latencies: [400, 400, 400], errors: 0, occurrences: 3 }], '2026-09-18')
    expect(stats.f.daysSeen).toBe(1)
    expect(stats.f.halfLife).toBeCloseTo(6.75)
    stats = updateKeyStats(stats, [{ char: 'f', latencies: [400], errors: 1, occurrences: 1 }], '2026-09-19')
    expect(stats.f.daysSeen).toBe(2)
    expect(stats.f.halfLife).toBeCloseTo(3.375)
    for (let i = 0; i < 10; i++) stats = updateKeyStats(stats, [{ char: 'f', latencies: [400, 400, 400], errors: 0, occurrences: 3 }])
    expect(stats.f.halfLife).toBe(30)
    stats = updateKeyStats(stats, [{ char: 'f', latencies: [], errors: 3, occurrences: 0 }])
    stats = updateKeyStats(stats, [{ char: 'f', latencies: [], errors: 3, occurrences: 0 }])
    stats = updateKeyStats(stats, [{ char: 'f', latencies: [], errors: 3, occurrences: 0 }])
    stats = updateKeyStats(stats, [{ char: 'f', latencies: [], errors: 3, occurrences: 0 }])
    expect(stats.f.halfLife).toBe(3)
  })

  it('weaknessScore forgets: a key not seen for a while climbs', () => {
    const stat = { latencyEma: 400, errorEma: 0, samples: 20, halfLife: 3, daysSeen: 4, lastSeen: '2026-09-10' }
    expect(weaknessScore(stat)).toBeCloseTo(1)
    expect(weaknessScore(stat, '2026-09-13')).toBeCloseTo(2)
    expect(weaknessScore(stat, '2026-09-30')).toBeCloseTo(3) // capped at +2
    expect(weaknessScore({ ...stat, halfLife: 30 }, '2026-09-13')).toBeCloseTo(1.1)
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
  // activeDays sits off the multiple of five so no freeze is earned by the bump under test
  const at = (count: number, lastDay: string, extra: Partial<ReturnType<typeof emptyStreak>> = {}) => ({ ...emptyStreak(), count, lastDay, best: count, activeDays: count + 2, ...extra })

  it('counts consecutive days, once per day', () => {
    let s = bumpStreak(emptyStreak(), '2026-09-15')
    expect(s).toEqual({ count: 1, lastDay: '2026-09-15', best: 1, freezes: 0, activeDays: 1 })
    s = bumpStreak(s, '2026-09-15')
    expect(s.count).toBe(1)
    expect(s.activeDays).toBe(1)
    s = bumpStreak(s, '2026-09-16')
    expect(s.count).toBe(2)
    expect(s.best).toBe(2)
  })

  it('never twice: one missed day is forgiven', () => {
    const s = bumpStreak(at(4, '2026-09-15'), '2026-09-17')
    expect(s.count).toBe(5)
    expect(s.freezes).toBe(0)
  })

  it('two missed days need a freeze; without one the streak restarts but the active days stay', () => {
    const lost = bumpStreak(at(4, '2026-09-15'), '2026-09-18')
    expect(lost.count).toBe(1)
    expect(lost.best).toBe(4)
    expect(lost.activeDays).toBe(7)
    const saved = bumpStreak(at(4, '2026-09-15', { freezes: 1 }), '2026-09-18')
    expect(saved.count).toBe(5)
    expect(saved.freezes).toBe(0)
    const twoSaved = bumpStreak(at(4, '2026-09-15', { freezes: 2 }), '2026-09-19')
    expect(twoSaved.count).toBe(5)
    expect(twoSaved.freezes).toBe(0)
    const notEnough = bumpStreak(at(4, '2026-09-15', { freezes: 1 }), '2026-09-19')
    expect(notEnough.count).toBe(1)
    expect(notEnough.freezes).toBe(1)
  })

  it('earns a freeze every five active days, up to two', () => {
    let s = emptyStreak()
    for (let d = 1; d <= FREEZE_EVERY * 3; d++) s = bumpStreak(s, `2026-09-${String(d).padStart(2, '0')}`)
    expect(s.activeDays).toBe(15)
    expect(s.freezes).toBe(MAX_FREEZES)
    expect(bumpStreak(emptyStreak(), '2026-09-01').freezes).toBe(0)
    let five = emptyStreak()
    for (let d = 1; d <= 5; d++) five = bumpStreak(five, `2026-09-0${d}`)
    expect(five.freezes).toBe(1)
  })

  it('alive while today can still save it; at risk from the second day without practice', () => {
    expect(daysBetween('2026-09-30', '2026-10-01')).toBe(1)
    expect(streakGap(at(3, '2026-09-30'), '2026-10-01')).toBe(1)
    expect(streakGap(emptyStreak(), '2026-10-01')).toBeNull()
    expect(streakAlive(at(3, '2026-09-30'), '2026-10-01')).toBe(true)
    expect(streakAlive(at(3, '2026-09-29'), '2026-10-01')).toBe(true)
    expect(streakAlive(at(3, '2026-09-28'), '2026-10-01')).toBe(false)
    expect(streakAlive(at(3, '2026-09-28', { freezes: 1 }), '2026-10-01')).toBe(true)
    expect(streakAtRisk(at(3, '2026-09-30'), '2026-10-01')).toBe(false)
    expect(streakAtRisk(at(3, '2026-09-29'), '2026-10-01')).toBe(true)
    expect(streakAlive(emptyStreak(), '2026-10-01')).toBe(false)
  })
})
