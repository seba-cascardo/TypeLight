import { describe, expect, it } from 'vitest'
import { backupDue, backupFilename, parseBackup, serializeBackup } from './backup'
import type { PersistedState } from '../store'

const state: PersistedState = {
  settings: { name: 'Seba', layoutId: 'latam', sound: true, showHands: true, onboarded: true, theme: 'auto', lastBackupAt: null },
  lessons: { 'guia-tip-intro': { stars: 3, bestWpm: 0, bestAcc: 1, attempts: 1, completedAt: '2026-09-15T12:00:00.000Z' } },
  keys: { f: { latencyEma: 300, errorEma: 0, samples: 12 } },
  sessions: [],
  streak: { count: 2, lastDay: '2026-09-17' },
  routine: { day: '2026-09-17', warmup: true, lesson: false, review: false, challenge: false },
  days: { '2026-09-17': { seconds: 40, blocks: 1, learned: 3, mastered: 1, reference: [], sessions: 1 } },
  legacy: null,
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
    const v2 = JSON.stringify({ app: 'typelight', version: 2, exportedAt: 'x', state: { settings: { name: 'S' }, sessions: [], days: {} } })
    const parsed = parseBackup(v2)
    expect(parsed.ok).toBe(true)
    if (parsed.ok) expect(parsed.state.legacy).toBeNull()
  })

  it('rejects things that are not a TypeLight backup', () => {
    expect(parseBackup('hola').ok).toBe(false)
    expect(parseBackup('{"app":"otra","version":1,"state":{}}').ok).toBe(false)
    expect(parseBackup('{"app":"typelight","version":99,"state":{}}').ok).toBe(false)
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
