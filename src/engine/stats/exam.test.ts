import { describe, expect, it } from 'vitest'
import { examDue, monthKey, weekKey } from './exam'

describe('weekly exam', () => {
  it('weekKey is the ISO Monday of the week', () => {
    expect(weekKey('2026-09-18')).toBe('2026-09-14') // Friday
    expect(weekKey('2026-09-14')).toBe('2026-09-14') // Monday
    expect(weekKey('2026-09-13')).toBe('2026-09-07') // Sunday belongs to the week before
    expect(weekKey('2026-01-01')).toBe('2025-12-29') // crosses the year
  })

  it('monthKey', () => {
    expect(monthKey('2026-09-18')).toBe('2026-09')
  })

  it('examDue: never taken, or taken in an earlier week', () => {
    expect(examDue(null, '2026-09-18')).toBe(true)
    expect(examDue('2026-09-14', '2026-09-18')).toBe(false)
    expect(examDue('2026-09-18', '2026-09-18')).toBe(false)
    expect(examDue('2026-09-13', '2026-09-14')).toBe(true)
    expect(examDue('2026-09-11', '2026-09-18')).toBe(true)
  })
})
