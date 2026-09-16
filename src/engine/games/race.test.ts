import { describe, expect, it } from 'vitest'
import { makeRng, poolOf } from '../generator'
import { ghostFinishMs, ghostPos, ghostWpm, raceOutcome, raceText } from './race'

const at = (day: string) => `${day}T12:00:00.000Z`

describe('ghost', () => {
  it('runs at the best reference session of the last 7 days, else at the goal', () => {
    const sessions = [
      { at: at('2026-09-01'), wpm: 40, reference: true as const }, // too old
      { at: at('2026-09-12'), wpm: 22, reference: true as const },
      { at: at('2026-09-15'), wpm: 60 }, // a lesson, not a reference
      { at: at('2026-09-16'), wpm: 27, reference: true as const },
    ]
    expect(ghostWpm(sessions, '2026-09-16', 18)).toBe(27)
    expect(ghostWpm([], '2026-09-16', 18)).toBe(18)
  })

  it('covers chars at wpm × 5 per minute and finishes accordingly', () => {
    expect(ghostPos(60_000, 24, 500)).toBe(120)
    expect(ghostPos(600_000, 24, 100)).toBe(100)
    expect(ghostFinishMs(24, 120)).toBe(60_000)
  })

  it('decides the race by finish time with a margin in seconds', () => {
    expect(raceOutcome(55_000, 24, 120)).toEqual({ won: true, marginSeconds: 5 })
    expect(raceOutcome(61_500, 24, 120)).toEqual({ won: false, marginSeconds: -1.5 })
  })
})

describe('raceText', () => {
  it('prefers real sentences and falls back to words with a small pool', () => {
    const full = raceText(poolOf('abcdefghijklmnopqrstuvwxyzñáéíóúü,.ABCDEFGHIJKLMNOPQRSTUVWXYZÑ¿?¡!'), makeRng(1))
    expect(full).toMatch(/[.?!]/)
    expect(full.length).toBeGreaterThan(40)
    const small = raceText(poolOf('fjdk'), makeRng(1))
    expect(small.length).toBeGreaterThan(20)
    expect(small).not.toMatch(/[.?!]/)
  })
})
