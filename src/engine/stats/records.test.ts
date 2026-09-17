import { describe, expect, it } from 'vitest'
import type { Days } from './days'
import { records } from './records'

const row = (extra: Partial<Days[string]> = {}): Days[string] => ({ seconds: 60, blocks: 0, learned: 0, mastered: 0, reference: [], sessions: 1, ...extra })
const at = (day: string) => `${day}T12:00:00.000Z`
const session = (day: string, chars: number, errors: number) => ({ at: at(day), wpm: 30, chars, errors, seconds: 60 })

describe('records', () => {
  it('finds the best Reto, the best 7-day median, the best weekly accuracy and the longest full-routine run', () => {
    const days: Days = {
      '2026-09-01': row({ reference: [20], blocks: 4 }),
      '2026-09-02': row({ reference: [25], blocks: 4 }),
      '2026-09-03': row({ reference: [30], blocks: 4 }),
      '2026-09-04': row({ reference: [22, 41], blocks: 2 }),
      '2026-09-05': row({ reference: [28], blocks: 4 }),
      '2026-09-06': row({ reference: [29], blocks: 4 }),
    }
    const sessions = [session('2026-09-01', 600, 30), session('2026-09-08', 600, 6)]
    const r = records(days, sessions)
    expect(r.bestReference).toEqual({ wpm: 41, day: '2026-09-04' })
    // day points 20, 25, 30, 32, 28, 29; trailing windows of ≥ 3 → 25, 28, 28, 29
    expect(r.bestMedian7).toEqual({ wpm: 29, day: '2026-09-06' })
    expect(r.bestWeeklyAcc).toEqual({ acc: 600 / 606, week: '2026-09-07', chars: 600 })
    expect(r.bestRoutineRun).toEqual({ days: 3, endDay: '2026-09-03' })
  })

  it('is empty without data; weekly accuracy needs 500 characters', () => {
    expect(records({}, [])).toEqual({ bestReference: null, bestMedian7: null, bestWeeklyAcc: null, bestRoutineRun: null })
    expect(records({}, [session('2026-09-01', 100, 0)]).bestWeeklyAcc).toBeNull()
  })
})
