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
    expect(v2.settings).toEqual({ name: 'Seba', lastBackupAt: null })
    expect(v2.days).toEqual({ '2026-09-10': { seconds: 0, blocks: 0, learned: 0, mastered: 0, reference: [22], sessions: 2 } })
    expect(v2.sessions[0].reference).toBeUndefined()
    expect(v2.sessions[1].reference).toBe(true)
  })

  it('leaves a current state untouched', () => {
    const v3 = { sessions: [], days: {}, legacy: null, settings: { lastBackupAt: null } }
    expect(migrateState(v3, 3)).toBe(v3)
  })

  it('tolerates an empty persisted state', () => {
    expect(migrateState(undefined, 1)).toEqual({ sessions: [], days: {}, legacy: null, settings: { lastBackupAt: null } })
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

  it('leaves a v3 state untouched', () => {
    const v3 = { sessions: [], days: {}, legacy: null, settings: { lastBackupAt: null } }
    expect(migrateState(v3, 3)).toBe(v3)
  })
})
