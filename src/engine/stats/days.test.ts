import { describe, expect, it } from 'vitest'
import { addSession, setBlocks, setSnapshot, type Days } from './days'

describe('days', () => {
  it('accumulates seconds per day without touching other days', () => {
    let days: Days = {}
    days = addSession(days, '2026-09-16', 30)
    days = addSession(days, '2026-09-16', 45.5)
    days = addSession(days, '2026-09-17', 10)
    expect(days['2026-09-16']).toEqual({ seconds: 75.5, blocks: 0, learned: 0, mastered: 0, reference: [], sessions: 2 })
    expect(days['2026-09-17'].seconds).toBe(10)
  })

  it('addSession sums seconds, counts the session and keeps reference speeds', () => {
    let d: Days = {}
    d = addSession(d, '2026-09-17', 40)
    d = addSession(d, '2026-09-17', 60, 28)
    d = addSession(d, '2026-09-17', 60, 31)
    expect(d['2026-09-17']).toEqual({ seconds: 160, blocks: 0, learned: 0, mastered: 0, reference: [28, 31], sessions: 3 })
  })

  it('sets routine blocks and keeps the same object when unchanged', () => {
    const a = setBlocks({}, '2026-09-16', 2)
    expect(a['2026-09-16'].blocks).toBe(2)
    expect(setBlocks(a, '2026-09-16', 2)).toBe(a)
    expect(setBlocks(a, '2026-09-16', 3)['2026-09-16'].blocks).toBe(3)
  })

  it('setBlocks and setSnapshot create a day with empty reference and zero sessions', () => {
    const d = setBlocks({}, '2026-09-17', 2)
    expect(d['2026-09-17'].reference).toEqual([])
    expect(d['2026-09-17'].sessions).toBe(0)
  })

  it('snapshots learned/mastered and keeps the same object when unchanged', () => {
    const a = setSnapshot({}, '2026-09-16', 12, 5)
    expect(a['2026-09-16']).toEqual({ seconds: 0, blocks: 0, learned: 12, mastered: 5, reference: [], sessions: 0 })
    expect(setSnapshot(a, '2026-09-16', 12, 5)).toBe(a)
    const b = setSnapshot(addSession(a, '2026-09-16', 20), '2026-09-16', 14, 6)
    expect(b['2026-09-16']).toEqual({ seconds: 20, blocks: 0, learned: 14, mastered: 6, reference: [], sessions: 1 })
  })
})
