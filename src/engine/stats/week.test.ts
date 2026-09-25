import { describe, expect, it } from 'vitest'
import type { Days } from './days'
import { activeWeeks, weekActiveDays, weekGoalLabel, weekWin, weeklySummary } from './week'

const row = (seconds: number, extra: Partial<Days[string]> = {}): Days[string] => ({ seconds, blocks: 0, learned: 0, mastered: 0, reference: [], sessions: 1, ...extra })
const at = (day: string) => `${day}T12:00:00.000Z`
const session = (day: string, chars: number, errors: number) => ({ at: at(day), wpm: 30, chars, errors, seconds: 60 })

describe('week', () => {
  // 2026-09-14 (Mon) … 2026-09-20 (Sun) is one ISO week; 2026-09-21 is the next Monday.
  const days: Days = {
    '2026-09-08': row(600, { reference: [30], learned: 8, mastered: 2 }),
    '2026-09-10': row(600, { reference: [32] }),
    '2026-09-14': row(300, { reference: [33], learned: 8, mastered: 3 }),
    '2026-09-15': row(300, { reference: [35] }),
    '2026-09-16': row(0),
    '2026-09-17': row(300, { reference: [36], learned: 9, mastered: 5 }),
    '2026-09-21': row(300),
  }

  it('weekActiveDays counts days with time inside the ISO week', () => {
    expect(weekActiveDays(days, '2026-09-18')).toBe(3)
    expect(weekActiveDays(days, '2026-09-21')).toBe(1)
    expect(weekActiveDays({}, '2026-09-18')).toBe(0)
  })

  it('activeWeeks counts the weeks that met the goal', () => {
    expect(activeWeeks(days, 2)).toBe(2)
    expect(activeWeeks(days, 3)).toBe(1)
    expect(activeWeeks(days, 1)).toBe(3)
  })

  it('weeklySummary describes the previous week against the one before', () => {
    const sessions = [session('2026-09-08', 400, 20), session('2026-09-14', 500, 10), session('2026-09-15', 500, 10)]
    const s = weeklySummary(days, sessions, '2026-09-21', 5)!
    expect(s.week).toBe('2026-09-14')
    expect(s.minutes).toBe(15)
    expect(s.activeDays).toBe(3)
    expect(s.refMedian).toBe(35)
    expect(s.refDelta).toBe(4) // vs. median(30, 32) = 31
    expect(s.acc).toBeCloseTo(1000 / 1020)
    expect(s.accDelta).toBeCloseTo(1000 / 1020 - 400 / 420)
    expect(s.masteredNew).toBe(3) // 5 at the end of the week vs. 2 before it
    expect(s.win).toBe('+4 PPM de velocidad de referencia')
  })

  it('weeklySummary is null when the previous week had no activity', () => {
    expect(weeklySummary(days, [], '2026-10-05', 5)).toBeNull()
    expect(weeklySummary({}, [], '2026-09-21', 5)).toBeNull()
  })

  it('weekWin picks the first win that applies', () => {
    const base = { week: 'w', minutes: 12, activeDays: 3, refMedian: null, refDelta: null, acc: null, accDelta: null, masteredNew: 0 }
    expect(weekWin({ ...base, refDelta: 2 }, 5)).toBe('+2 PPM de velocidad de referencia')
    expect(weekWin({ ...base, masteredNew: 1 }, 5)).toBe('1 tecla nueva dominada')
    expect(weekWin({ ...base, masteredNew: 2 }, 5)).toBe('2 teclas nuevas dominadas')
    expect(weekWin({ ...base, accDelta: 0.012 }, 5)).toBe('+1 punto de precisión')
    expect(weekWin({ ...base, activeDays: 5 }, 5)).toBe('meta semanal cumplida: 5 de 5 días')
    expect(weekWin(base, 5)).toBe('12 minutos: todos cuentan')
  })
})

describe('weekly goal label', () => {
  it('reads «N de M días» under the goal and says it was met past it, never «6 de 5»', () => {
    expect(weekGoalLabel(3, 5)).toBe('3 de 5 días')
    expect(weekGoalLabel(1, 5)).toBe('1 de 5 días')
    expect(weekGoalLabel(5, 5)).toBe('5 de 5 días, meta cumplida')
    expect(weekGoalLabel(6, 5)).toBe('6 días, meta de 5 cumplida')
  })
})
