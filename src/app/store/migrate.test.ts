import { describe, expect, it } from 'vitest'
import { migrateState } from './migrate'

describe('store migration v1 → v2', () => {
  const noon = (day: string) => new Date(`${day}T12:00:00`).toISOString() // local noon: the local day is unambiguous

  it('marks challenge sessions as reference and adds empty days', () => {
    const v1 = {
      settings: { name: 'Seba' },
      sessions: [
        { at: noon('2026-09-10'), kind: 'lesson', wpm: 40, acc: 1, chars: 20, errors: 0, seconds: 6 },
        { at: noon('2026-09-10'), kind: 'challenge', wpm: 22, acc: 0.97, chars: 110, errors: 3, seconds: 60 },
      ],
    }
    const v2 = migrateState(v1, 1) as {
      sessions: { kind: string; reference?: true }[]
      days: Record<string, { seconds: number; blocks: number; learned: number; mastered: number; reference: number[]; sessions: number }>
      settings: { name: string; lastBackupAt: string | null }
    }
    expect(v2.settings).toEqual({ name: 'Seba', lastBackupAt: null, anchor: '', conversoSeen: false, weeklyGoal: 5, mascot: true, commitment: '', metronome: false })
    expect(v2.days).toEqual({ '2026-09-10': { seconds: 0, blocks: 0, learned: 0, mastered: 0, reference: [22], sessions: 2 } })
    expect(v2.sessions[0].reference).toBeUndefined()
    expect(v2.sessions[1].reference).toBe(true)
  })

  it('tolerates an empty persisted state', () => {
    expect(migrateState(undefined, 1)).toEqual({
      sessions: [],
      days: {},
      legacy: null,
      lastExamDay: null,
      blindSince: null,
      streak: { count: 0, lastDay: null, best: 0, freezes: 0, activeDays: 0 },
      milestonesSeen: [],
      lastWeeklySummaryWeek: null,
      keys: {},
      bigrams: {},
      words: {},
      commitments: {},
      settings: { lastBackupAt: null, anchor: '', conversoSeen: false, weeklyGoal: 5, mascot: true, commitment: '', metronome: false },
    })
  })
})

describe('store migration v2 → v3', () => {
  const noon = (day: string) => new Date(`${day}T12:00:00`).toISOString() // local noon: the local day is unambiguous

  it('backfills reference speeds and session counts per local day, adds legacy and lastBackupAt', () => {
    const v2 = {
      settings: { name: 'Seba' },
      sessions: [
        { at: noon('2026-09-10'), kind: 'lesson', wpm: 40, acc: 1, chars: 20, errors: 0, seconds: 6 },
        { at: noon('2026-09-10'), kind: 'challenge', wpm: 22, acc: 0.97, chars: 110, errors: 3, seconds: 60, reference: true },
        { at: noon('2026-09-11'), kind: 'game', wpm: 25, acc: 0.98, chars: 100, errors: 2, seconds: 50, reference: true },
      ],
      days: { '2026-09-10': { seconds: 66, blocks: 2, learned: 8, mastered: 3 } },
    }
    const v3 = migrateState(v2, 2) as {
      settings: { name: string; lastBackupAt: string | null }
      days: Record<string, { seconds: number; blocks: number; learned: number; mastered: number; reference: number[]; sessions: number }>
      legacy: unknown
    }
    expect(v3.days['2026-09-10']).toEqual({ seconds: 66, blocks: 2, learned: 8, mastered: 3, reference: [22], sessions: 2 })
    expect(v3.days['2026-09-11']).toEqual({ seconds: 0, blocks: 0, learned: 0, mastered: 0, reference: [25], sessions: 1 })
    expect(v3.legacy).toBeNull()
    expect(v3.settings.lastBackupAt).toBeNull()
  })

  it('chains v1 → v2 → v3', () => {
    const v1 = { sessions: [{ at: noon('2026-09-10'), kind: 'challenge', wpm: 22, acc: 1, chars: 10, errors: 0, seconds: 60 }] }
    const v3 = migrateState(v1, 1) as { days: Record<string, { reference: number[] }>; sessions: { reference?: true }[] }
    expect(v3.sessions[0].reference).toBe(true)
    expect(v3.days['2026-09-10'].reference).toEqual([22])
  })

  it('chains into v4', () => {
    const v3 = { sessions: [], days: {}, legacy: null, settings: { lastBackupAt: null } }
    const v4 = migrateState(v3, 3) as { lastExamDay: unknown; blindSince: unknown; settings: Record<string, unknown> }
    expect(v4.lastExamDay).toBeNull()
    expect(v4.blindSince).toBeNull()
    expect(v4.settings).toEqual({ lastBackupAt: null, anchor: '', conversoSeen: false, weeklyGoal: 5, mascot: true, commitment: '', metronome: false })
  })
})

describe('store migration v3 → v4', () => {
  it('adds the weekly exam day, the blind mark and the converso settings, keeping everything else', () => {
    const v3 = { sessions: [{ at: 'x', kind: 'challenge', wpm: 30 }], days: { d: { reference: [30] } }, legacy: { wpm: 45 }, settings: { name: 'Seba', lastBackupAt: null } }
    const v4 = migrateState(v3, 3) as typeof v3 & { lastExamDay: null; blindSince: null; settings: { anchor: string; conversoSeen: boolean } }
    expect(v4.sessions).toBe(v3.sessions)
    expect(v4.days).toBe(v3.days)
    expect(v4.legacy).toBe(v3.legacy)
    expect(v4.settings).toEqual({ name: 'Seba', lastBackupAt: null, anchor: '', conversoSeen: false, weeklyGoal: 5, mascot: true, commitment: '', metronome: false })
    expect(v4.lastExamDay).toBeNull()
    expect(v4.blindSince).toBeNull()
  })

  it('chains into v5', () => {
    const v4 = { sessions: [], days: {}, legacy: null, lastExamDay: null, blindSince: null, settings: { lastBackupAt: null, anchor: '', conversoSeen: false } }
    const v5 = migrateState(v4, 4) as { streak: unknown; milestonesSeen: unknown; lastWeeklySummaryWeek: unknown; settings: Record<string, unknown> }
    expect(v5.streak).toEqual({ count: 0, lastDay: null, best: 0, freezes: 0, activeDays: 0 })
    expect(v5.milestonesSeen).toEqual([])
    expect(v5.lastWeeklySummaryWeek).toBeNull()
    expect(v5.settings).toEqual({ lastBackupAt: null, anchor: '', conversoSeen: false, weeklyGoal: 5, mascot: true, commitment: '', metronome: false })
  })
})

describe('store migration v4 → v5', () => {
  it('extends the streak with best, freezes and the active days counted from `days`', () => {
    const v4 = {
      streak: { count: 3, lastDay: '2026-09-18' },
      days: { '2026-09-16': { seconds: 60 }, '2026-09-17': { seconds: 0 }, '2026-09-18': { seconds: 120 }, '2026-09-10': { seconds: 30 } },
      settings: { name: 'Seba' },
    }
    const v5 = migrateState(v4, 4) as { streak: { count: number; lastDay: string; best: number; freezes: number; activeDays: number }; settings: Record<string, unknown> }
    expect(v5.streak).toEqual({ count: 3, lastDay: '2026-09-18', best: 3, freezes: 0, activeDays: 3 })
    expect(v5.settings).toEqual({ name: 'Seba', weeklyGoal: 5, mascot: true, commitment: '', metronome: false })
  })

  it('never counts fewer active days than the streak', () => {
    const v5 = migrateState({ streak: { count: 4, lastDay: '2026-09-18' }, days: {} }, 4) as { streak: { activeDays: number; best: number } }
    expect(v5.streak.activeDays).toBe(4)
    expect(v5.streak.best).toBe(4)
  })

  it('chains into v6', () => {
    const v5 = { sessions: [], days: {}, legacy: null, streak: { count: 0, lastDay: null, best: 0, freezes: 0, activeDays: 0 }, milestonesSeen: [], lastWeeklySummaryWeek: null, keys: {} }
    const v6 = migrateState(v5, 5) as { bigrams: unknown; words: unknown }
    expect(v6.bigrams).toEqual({})
    expect(v6.words).toEqual({})
  })
})

describe('store migration v5 → v6', () => {
  it('gives every key a half-life and a day count, and adds empty bigram and word tables', () => {
    const v5 = { keys: { f: { latencyEma: 300, errorEma: 0, samples: 10, lastSeen: '2026-09-18' }, j: { latencyEma: 300, errorEma: 0, samples: 10 } } }
    const v6 = migrateState(v5, 5) as { keys: Record<string, { halfLife: number; daysSeen: number }>; bigrams: unknown; words: unknown }
    expect(v6.keys.f).toEqual({ latencyEma: 300, errorEma: 0, samples: 10, lastSeen: '2026-09-18', halfLife: 3, daysSeen: 1 })
    expect(v6.keys.j).toEqual({ latencyEma: 300, errorEma: 0, samples: 10, halfLife: 3, daysSeen: 0 })
    expect(v6.bigrams).toEqual({})
    expect(v6.words).toEqual({})
  })

  it('chains into v7', () => {
    const v6 = { sessions: [], days: {}, legacy: null, keys: {}, bigrams: {}, words: {}, settings: { name: 'S' } }
    const v7 = migrateState(v6, 6) as { commitments: unknown; settings: Record<string, unknown> }
    expect(v7.commitments).toEqual({})
    expect(v7.settings).toEqual({ name: 'S', commitment: '', metronome: false })
  })

  it('leaves a v7 state untouched', () => {
    const v7 = { sessions: [], days: {}, legacy: null, keys: {}, bigrams: {}, words: {}, commitments: {} }
    expect(migrateState(v7, 7)).toBe(v7)
  })
})
