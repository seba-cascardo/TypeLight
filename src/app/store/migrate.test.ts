import { describe, expect, it } from 'vitest'
import { migrateState } from './migrate'

describe('store migration v1 → v2', () => {
  it('marks challenge sessions as reference and adds empty days', () => {
    const v1 = {
      settings: { name: 'Seba' },
      sessions: [
        { at: '2026-09-10T15:00:00Z', kind: 'lesson', wpm: 40, acc: 1, chars: 20, errors: 0, seconds: 6 },
        { at: '2026-09-10T15:05:00Z', kind: 'challenge', wpm: 22, acc: 0.97, chars: 110, errors: 3, seconds: 60 },
      ],
    }
    const v2 = migrateState(v1, 1) as { sessions: { kind: string; reference?: true }[]; days: object; settings: object }
    expect(v2.settings).toEqual({ name: 'Seba' })
    expect(v2.days).toEqual({})
    expect(v2.sessions[0].reference).toBeUndefined()
    expect(v2.sessions[1].reference).toBe(true)
  })

  it('leaves a current state untouched', () => {
    const v2 = { sessions: [], days: { '2026-09-16': { seconds: 1, blocks: 1, learned: 2, mastered: 0 } } }
    expect(migrateState(v2, 2)).toBe(v2)
  })

  it('tolerates an empty persisted state', () => {
    expect(migrateState(undefined, 1)).toEqual({ sessions: [], days: {} })
  })
})
