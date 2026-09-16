import { describe, expect, it } from 'vitest'
import type { Days } from './days'
import {
  calendar,
  constancy,
  mastery,
  masteryCounts,
  masteryMap,
  median,
  movingAverage,
  referenceByDay,
  referenceHeadline,
  rhythmHeadline,
  shiftDay,
  snapshotBefore,
  unitMarks,
  weeklyAccuracy,
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

describe('reference speed', () => {
  const sessions = [
    session('2026-09-08', 20, { reference: true }),
    session('2026-09-08', 60), // a lesson: never a reference point
    session('2026-09-15', 24, { reference: true }),
    session('2026-09-16', 30, { reference: true }),
    session('2026-09-16', 26, { reference: true }),
    session('2026-09-16', 90),
  ]

  it('folds reference sessions into one median point per day, oldest first', () => {
    expect(referenceByDay(sessions)).toEqual([
      { day: '2026-09-08', wpm: 20, n: 1 },
      { day: '2026-09-15', wpm: 24, n: 1 },
      { day: '2026-09-16', wpm: 28, n: 2 },
    ])
  })

  it('headline = last point, delta vs. the nearest point 7–10 days back', () => {
    expect(referenceHeadline(referenceByDay(sessions))).toEqual({ value: 28, day: '2026-09-16', delta: 8 })
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
      '2026-09-10': { seconds: 1, blocks: 1, learned: 10, mastered: 4 },
      '2026-09-12': { seconds: 1, blocks: 1, learned: 10, mastered: 6 },
      '2026-09-14': { seconds: 1, blocks: 1, learned: 16, mastered: 6 },
      '2026-09-15': { seconds: 1, blocks: 0, learned: 0, mastered: 0 }, // no snapshot that day
      '2026-09-16': { seconds: 1, blocks: 1, learned: 18, mastered: 7 },
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
    '2026-09-06': { seconds: 600, blocks: 4, learned: 10, mastered: 3 },
    '2026-09-09': { seconds: 300, blocks: 2, learned: 12, mastered: 5 },
    '2026-09-14': { seconds: 900, blocks: 4, learned: 16, mastered: 8 },
    '2026-09-16': { seconds: 420, blocks: 4, learned: 16, mastered: 9 },
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

describe('rhythm headline', () => {
  it('weights the last 10 sessions with rhythm by chars and compares with the 10 before', () => {
    const before = Array.from({ length: 10 }, (_, i) => session(`2026-09-0${(i % 9) + 1}`, 10, { rhythm: 0.5, chars: 100 }))
    const recent = Array.from({ length: 10 }, (_, i) => session(`2026-09-1${i % 6}`, 10, { rhythm: i < 5 ? 0.6 : 0.8, chars: i < 5 ? 100 : 300 }))
    const r = rhythmHeadline([...before, session('2026-09-16', 10), ...recent])
    expect(r?.value).toBeCloseTo((5 * 0.6 * 100 + 5 * 0.8 * 300) / 2000)
    expect(r?.delta).toBeCloseTo(r!.value - 0.5)
    expect(rhythmHeadline([session('2026-09-16', 10)])).toBeNull()
    expect(rhythmHeadline([session('2026-09-16', 10, { rhythm: 0.7 })])).toEqual({ value: 0.7, delta: null })
  })
})
