import { describe, expect, it } from 'vitest'
import { addSeconds, setBlocks, setSnapshot, type Days } from './days'

describe('days', () => {
  it('accumulates seconds per day without touching other days', () => {
    let days: Days = {}
    days = addSeconds(days, '2026-09-16', 30)
    days = addSeconds(days, '2026-09-16', 45.5)
    days = addSeconds(days, '2026-09-17', 10)
    expect(days['2026-09-16']).toEqual({ seconds: 75.5, blocks: 0, learned: 0, mastered: 0 })
    expect(days['2026-09-17'].seconds).toBe(10)
  })

  it('sets routine blocks and keeps the same object when unchanged', () => {
    const a = setBlocks({}, '2026-09-16', 2)
    expect(a['2026-09-16'].blocks).toBe(2)
    expect(setBlocks(a, '2026-09-16', 2)).toBe(a)
    expect(setBlocks(a, '2026-09-16', 3)['2026-09-16'].blocks).toBe(3)
  })

  it('snapshots learned/mastered and keeps the same object when unchanged', () => {
    const a = setSnapshot({}, '2026-09-16', 12, 5)
    expect(a['2026-09-16']).toEqual({ seconds: 0, blocks: 0, learned: 12, mastered: 5 })
    expect(setSnapshot(a, '2026-09-16', 12, 5)).toBe(a)
    const b = setSnapshot(addSeconds(a, '2026-09-16', 20), '2026-09-16', 14, 6)
    expect(b['2026-09-16']).toEqual({ seconds: 20, blocks: 0, learned: 14, mastered: 6 })
  })
})
