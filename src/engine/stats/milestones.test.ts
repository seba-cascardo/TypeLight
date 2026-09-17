import { describe, expect, it } from 'vitest'
import type { Days } from './days'
import { MILESTONES, milestoneCopy, milestoneReached, monthSummary } from './milestones'

const row = (extra: Partial<Days[string]> = {}): Days[string] => ({ seconds: 60, blocks: 0, learned: 0, mastered: 0, reference: [], sessions: 1, ...extra })

describe('milestones', () => {
  it('returns the highest reached milestone not yet seen', () => {
    expect(MILESTONES).toEqual([7, 14, 30, 66, 100])
    expect(milestoneReached(6, [])).toBeNull()
    expect(milestoneReached(7, [])).toBe(7)
    expect(milestoneReached(20, [])).toBe(14)
    expect(milestoneReached(20, [14])).toBeNull()
    expect(milestoneReached(20, [7])).toBe(14)
    expect(milestoneReached(100, [7, 14, 30, 66])).toBe(100)
  })

  it('every milestone has copy', () => {
    for (const m of MILESTONES) expect(milestoneCopy(m).length).toBeGreaterThan(10)
  })

  it('monthSummary compares today with 30 days ago', () => {
    const days: Days = {
      '2026-08-19': row({ seconds: 600, reference: [24], learned: 6, mastered: 1 }),
      '2026-08-20': row({ seconds: 600, reference: [26], learned: 6, mastered: 2 }),
      '2026-09-17': row({ seconds: 600, reference: [32], learned: 10, mastered: 5 }),
      '2026-09-18': row({ seconds: 300, reference: [34], learned: 10, mastered: 6 }),
    }
    const m = monthSummary(days, '2026-09-18')
    expect(m.minutes).toBe(25)
    expect(m.activeDays).toBe(3) // 08-19 is outside the 30-day window
    expect(m.refNow).toBe(33)
    expect(m.refThen).toBe(24) // the 7 days ending 30 days ago: only 08-19
    expect(m.masteredNow).toBe(6)
    expect(m.masteredThen).toBe(1) // last snapshot at least 30 days old
  })
})
