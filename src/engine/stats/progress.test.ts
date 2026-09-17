import { describe, expect, it } from 'vitest'
import type { Days } from './days'
import {
  calendar,
  constancy,
  legacyBeaten,
  mastery,
  dominance,
  fingerDominance,
  masteryCounts,
  masteryMap,
  median,
  movingAverage,
  referenceByDay,
  referenceHeadline,
  fluidity,
  shiftDay,
  snapshotBefore,
  unitMarks,
  weeklyAccuracy,
  type DayPoint,
  type SessionLike,
} from './progress'

/** Noon UTC keeps the local day equal to the calendar day in any timezone between UTC−11 and UTC+11. */
const at = (day: string) => `${day}T12:00:00.000Z`
const session = (day: string, wpm: number, extra: Partial<SessionLike> = {}): SessionLike => ({
  at: at(day),
  wpm,
  chars: 100,
  errors: 2,
  seconds: 30,
  ...extra,
})

describe('shiftDay / median', () => {
  it('shifts across month and year boundaries', () => {
    expect(shiftDay('2026-09-30', 1)).toBe('2026-10-01')
    expect(shiftDay('2026-01-01', -1)).toBe('2025-12-31')
    expect(shiftDay('2026-09-16', -7)).toBe('2026-09-09')
  })
  it('takes the middle value, rounding the mean of the two middles', () => {
    expect(median([])).toBe(0)
    expect(median([30])).toBe(30)
    expect(median([10, 40, 20])).toBe(20)
    expect(median([10, 21, 40, 20])).toBe(21)
  })
})

describe('referenceByDay from days', () => {
  it('folds each day to the median of its reference speeds, oldest first, skipping days without one', () => {
    const days: Days = {
      '2026-09-12': { seconds: 60, blocks: 1, learned: 8, mastered: 2, reference: [20, 30, 26], sessions: 3 },
      '2026-09-10': { seconds: 60, blocks: 1, learned: 8, mastered: 2, reference: [22], sessions: 1 },
      '2026-09-11': { seconds: 60, blocks: 1, learned: 8, mastered: 2, reference: [], sessions: 2 },
    }
    expect(referenceByDay(days)).toEqual([
      { day: '2026-09-10', wpm: 22, n: 1 },
      { day: '2026-09-12', wpm: 26, n: 3 },
    ])
  })

  it('carries the weekly exam speed of the day when there is one', () => {
    const days: Days = {
      '2026-09-14': { seconds: 180, blocks: 1, learned: 8, mastered: 2, reference: [28], sessions: 1, exam: 28 },
    }
    expect(referenceByDay(days)).toEqual([{ day: '2026-09-14', wpm: 28, n: 1, exam: 28 }])
  })
})

describe('legacyBeaten', () => {
  const p = (day: string, wpm: number) => ({ day, wpm, n: 1 })
  it('needs at least three days and a 7-day median at or above the legacy speed', () => {
    expect(legacyBeaten([p('2026-09-10', 50)], 40)).toBe(false)
    expect(legacyBeaten([p('2026-09-10', 30), p('2026-09-11', 45), p('2026-09-12', 44)], 40)).toBe(true)
    expect(legacyBeaten([p('2026-09-10', 30), p('2026-09-11', 45), p('2026-09-12', 39)], 40)).toBe(false)
  })
  it('only looks at the last seven days with data', () => {
    const old = Array.from({ length: 7 }, (_, i) => p(`2026-09-0${i + 1}`, 10))
    const recent = Array.from({ length: 7 }, (_, i) => p(`2026-09-1${i + 1}`, 45))
    expect(legacyBeaten([...old, ...recent], 40)).toBe(true)
  })
})

describe('referenceHeadline', () => {
  const points: DayPoint[] = [
    { day: '2026-09-08', wpm: 20, n: 1 },
    { day: '2026-09-15', wpm: 24, n: 1 },
    { day: '2026-09-16', wpm: 28, n: 2 },
  ]

  it('headline = last point, delta vs. the nearest point 7–10 days back', () => {
    expect(referenceHeadline(points)).toEqual({ value: 28, day: '2026-09-16', delta: 8 })
    expect(referenceHeadline([{ day: '2026-09-16', wpm: 28, n: 2 }])).toEqual({ value: 28, day: '2026-09-16', delta: null })
    expect(referenceHeadline([])).toBeNull()
  })

  it('moving average uses partial windows at the start', () => {
    expect(movingAverage([10, 20, 30, 40])).toEqual([10, 15, 20, 30])
  })
})

describe('unit marks', () => {
  it('marks the days the learned pool grew', () => {
    const days: Days = {
      '2026-09-10': { seconds: 1, blocks: 1, learned: 10, mastered: 4, reference: [], sessions: 0 },
      '2026-09-12': { seconds: 1, blocks: 1, learned: 10, mastered: 6, reference: [], sessions: 0 },
      '2026-09-14': { seconds: 1, blocks: 1, learned: 16, mastered: 6, reference: [], sessions: 0 },
      '2026-09-15': { seconds: 1, blocks: 0, learned: 0, mastered: 0, reference: [], sessions: 0 }, // no snapshot that day
      '2026-09-16': { seconds: 1, blocks: 1, learned: 18, mastered: 7, reference: [], sessions: 0 },
    }
    expect(unitMarks(days)).toEqual([
      { day: '2026-09-14', added: 6 },
      { day: '2026-09-16', added: 2 },
    ])
  })
})

describe('weekly accuracy', () => {
  it('weights by characters over the last 7 days only', () => {
    const sessions = [
      session('2026-09-08', 10, { chars: 1000, errors: 0 }), // 8 days ago: out
      session('2026-09-10', 10, { chars: 20, errors: 20 }),
      session('2026-09-16', 10, { chars: 380, errors: 0 }),
    ]
    expect(weeklyAccuracy(sessions, '2026-09-16')).toEqual({ acc: 400 / 420, chars: 400 })
    expect(weeklyAccuracy([], '2026-09-16')).toBeNull()
  })
})

describe('mastery', () => {
  // goal 15 PPM → target gap 800 ms
  it('grades a key by samples, error rate and latency against the goal speed', () => {
    expect(mastery(undefined, 15)).toBe(1)
    expect(mastery({ latencyEma: 700, errorEma: 0.02, samples: 12 }, 15)).toBe(3)
    expect(mastery({ latencyEma: 700, errorEma: 0.02, samples: 9 }, 15)).toBe(2)
    expect(mastery({ latencyEma: 1200, errorEma: 0.05, samples: 20 }, 15)).toBe(2)
    expect(mastery({ latencyEma: 1300, errorEma: 0.05, samples: 20 }, 15)).toBe(1)
    expect(mastery({ latencyEma: 300, errorEma: 0.2, samples: 20 }, 15)).toBe(1)
  })

  it('dominance is a 0..1 blend of samples, error rate and latency', () => {
    // goal 15 PPM → target gap 800 ms
    expect(dominance(undefined, 15)).toBe(0)
    expect(dominance({ latencyEma: 800, errorEma: 0, samples: 10 }, 15)).toBe(1)
    expect(dominance({ latencyEma: 800, errorEma: 0.09, samples: 10 }, 15)).toBeCloseTo(0.5)
    expect(dominance({ latencyEma: 1200, errorEma: 0, samples: 10 }, 15)).toBeCloseTo(0.5)
    expect(dominance({ latencyEma: 800, errorEma: 0, samples: 5 }, 15)).toBeCloseTo(0.5)
    expect(dominance({ latencyEma: 3000, errorEma: 0.5, samples: 50 }, 15)).toBe(0)
  })

  it('fingerDominance averages the learned keys of each finger; fingers without keys are absent', () => {
    // goal 15 PPM → target gap 800 ms
    const keys = {
      a: { latencyEma: 800, errorEma: 0, samples: 10 }, // LP: 1
      q: { latencyEma: 800, errorEma: 0, samples: 5 }, // LP: 0.5
      f: { latencyEma: 800, errorEma: 0, samples: 10 }, // LI: 1
      x: { latencyEma: 200, errorEma: 0, samples: 50 }, // not learned
    }
    const fingerOf = (ch: string) => ({ a: 'LP', q: 'LP', f: 'LI', j: 'RI', x: 'LR' })[ch] as 'LP' | 'LI' | 'RI' | 'LR' | undefined
    const r = fingerDominance(keys, ['a', 'q', 'f', 'j'], 15, fingerOf)
    expect(r.LP).toEqual({ value: 0.75, keys: 2 })
    expect(r.LI).toEqual({ value: 1, keys: 1 })
    expect(r.RI).toEqual({ value: 0, keys: 1 })
    expect(r.LR).toBeUndefined()
  })

  it('maps and counts only learned keys', () => {
    const keys = {
      f: { latencyEma: 500, errorEma: 0, samples: 30 },
      j: { latencyEma: 1000, errorEma: 0.05, samples: 6 },
      q: { latencyEma: 200, errorEma: 0, samples: 50 }, // not learned: ignored
    }
    const map = masteryMap(keys, ['f', 'j', 'd', ' '], 15)
    expect(map).toEqual({ f: 3, j: 2, d: 1, ' ': 1 })
    expect(masteryCounts(map)).toEqual({ mastered: 1, onTrack: 1, weak: 2, learned: 4 })
  })
})

describe('snapshots, calendar, constancy', () => {
  const days: Days = {
    '2026-09-06': { seconds: 600, blocks: 4, learned: 10, mastered: 3, reference: [], sessions: 0 },
    '2026-09-09': { seconds: 300, blocks: 2, learned: 12, mastered: 5, reference: [], sessions: 0 },
    '2026-09-14': { seconds: 900, blocks: 4, learned: 16, mastered: 8, reference: [], sessions: 0 },
    '2026-09-16': { seconds: 420, blocks: 4, learned: 16, mastered: 9, reference: [], sessions: 0 },
  }

  it('finds the nearest snapshot 7–10 days back', () => {
    expect(snapshotBefore(days, '2026-09-16')).toEqual(days['2026-09-09']) // 7 days
    expect(snapshotBefore(days, '2026-09-15')).toEqual(days['2026-09-06']) // 9 days
    expect(snapshotBefore(days, '2026-09-30')).toBeNull()
  })

  it('builds n days ending today with a state each', () => {
    const cells = calendar(days, '2026-09-16', 8)
    expect(cells.map((c) => c.day)).toEqual(['2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12', '2026-09-13', '2026-09-14', '2026-09-15', '2026-09-16'])
    expect(cells.map((c) => c.state)).toEqual(['part', 'none', 'none', 'none', 'none', 'full', 'none', 'full'])
    expect(cells[7].seconds).toBe(420)
  })

  it('counts full routines and minutes over the last 7 days, total minutes overall', () => {
    expect(constancy(days, '2026-09-16')).toEqual({ fullOfLast7: 2, minutesPerDay: 11, totalMinutes: 37 })
  })
})

describe('fluidity', () => {
  it('is the chars-weighted rollover of the last 7 days, or null without one', () => {
    const list = [
      session('2026-09-01', 10, { rollover: 0.9, chars: 500 }), // too old
      session('2026-09-12', 10, { rollover: 0.2, chars: 100 }),
      session('2026-09-16', 10, { rollover: 0.5, chars: 300 }),
      session('2026-09-16', 10), // no rollover: ignored
    ]
    expect(fluidity(list, '2026-09-16')).toBeCloseTo((0.2 * 100 + 0.5 * 300) / 400)
    expect(fluidity([session('2026-09-16', 10)], '2026-09-16')).toBeNull()
    expect(fluidity(list, '2026-09-30')).toBeNull()
  })
})
