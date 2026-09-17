import { describe, expect, it } from 'vitest'
import { backupDue, backupFilename, parseBackup, serializeBackup } from './backup'
import type { PersistedState } from '../store'

const state: PersistedState = {
  settings: { name: 'Seba', layoutId: 'latam', sound: true, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null, anchor: '', conversoSeen: true },
  lessons: { 'guia-tip-intro': { stars: 3, bestWpm: 0, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T12:00:00.000Z' } },
  keys: { f: { latencyEma: 300, errorEma: 0, samples: 12 } },
  sessions: [],
  streak: { count: 2, lastDay: '2026-09-17' },
  routine: { day: '2026-09-17', warmup: true, lesson: false, review: false, challenge: false },
  days: { '2026-09-17': { seconds: 40, blocks: 1, learned: 3, mastered: 1, reference: [], sessions: 1 } },
  legacy: null,
  lastExamDay: null,
  blindSince: '2026-09-17',
}

describe('backup', () => {
  it('round-trips the persisted state', () => {
    const text = serializeBackup(state, new Date('2026-09-17T15:00:00Z'))
    const parsed = parseBackup(text)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.state).toEqual(state)
      expect(parsed.exportedAt).toBe('2026-09-17T15:00:00.000Z')
    }
  })

  it('migrates an older backup on import', () => {
    const v2state = {
      settings: { name: 'S', layoutId: 'latam', sound: true, showHands: true, onboarded: true, theme: 'auto' },
      lessons: {},
      keys: {},
      sessions: [],
      streak: { count: 0, lastDay: null },
      routine: { day: '2026-09-17', warmup: false, lesson: false, review: false, challenge: false },
      days: {},
    }
    const v2 = JSON.stringify({ app: 'typelight', version: 2, exportedAt: 'x', state: v2state })
    const parsed = parseBackup(v2)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) {
      expect(parsed.state.legacy).toBeNull()
      expect(parsed.state.lastExamDay).toBeNull()
      expect(parsed.state.settings.anchor).toBe('')
    }
  })

  it('rejects a v4 state with a malformed blind mark', () => {
    const bad = JSON.stringify({ app: 'typelight', version: 4, exportedAt: 'x', state: { ...state, blindSince: 3 } })
    expect(parseBackup(bad).ok).toBe(false)
  })

  it('rejects things that are not a TypeLight backup', () => {
    expect(parseBackup('hola').ok).toBe(false)
    expect(parseBackup('{"app":"otra","version":1,"state":{}}').ok).toBe(false)
    expect(parseBackup('{"app":"typelight","version":99,"state":{}}').ok).toBe(false)
  })

  it('rejects a malformed state instead of crashing on import', () => {
    const withDays = (days: unknown) => JSON.stringify({ app: 'typelight', version: 4, exportedAt: 'x', state: { ...state, days } })

    // A `days` map that isn't an object at all.
    expect(parseBackup(withDays(null)).ok).toBe(false)

    // A day row missing `reference`.
    expect(parseBackup(withDays({ '2026-09-17': { seconds: 40, blocks: 1, learned: 3, mastered: 1, sessions: 1 } })).ok).toBe(false)

    // A v2 backup whose `sessions` survives migration as something other than an array.
    const v2 = JSON.stringify({
      app: 'typelight',
      version: 2,
      exportedAt: 'x',
      state: { settings: { name: 'S' }, sessions: 'x', days: {} },
    })
    expect(parseBackup(v2).ok).toBe(false)

    // A layout that doesn't exist.
    expect(parseBackup(JSON.stringify({ app: 'typelight', version: 4, exportedAt: 'x', state: { ...state, settings: { ...state.settings, layoutId: 'dvorak' } } })).ok).toBe(false)

    // Missing a required top-level key entirely.
    const withoutLegacy: Record<string, unknown> = { ...state }
    delete withoutLegacy.legacy
    expect(parseBackup(JSON.stringify({ app: 'typelight', version: 4, exportedAt: 'x', state: withoutLegacy })).ok).toBe(false)
  })

  it('names the file by local day', () => {
    expect(backupFilename(new Date(2026, 8, 17, 9))).toBe('typelight-progreso-2026-09-17.json')
  })

  it('is due after 30 days, or with two weeks of activity and no backup yet', () => {
    expect(backupDue(null, '2026-09-17', 3)).toBe(false)
    expect(backupDue(null, '2026-09-17', 14)).toBe(true)
    expect(backupDue('2026-08-01T12:00:00.000Z', '2026-09-17', 1)).toBe(true)
    expect(backupDue('2026-09-10T12:00:00.000Z', '2026-09-17', 40)).toBe(false)
  })
})
