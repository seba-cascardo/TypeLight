import { beforeEach, describe, expect, it } from 'vitest'
import { PERSISTED_KEYS, useStore } from './index'

const initialState = useStore.getState()

beforeEach(() => {
  useStore.setState(initialState, true)
})

describe('store', () => {
  it('persists exactly the data fields, no more and no less: a future field cannot be left out of the backup', () => {
    const dataKeys = Object.entries(useStore.getState())
      .filter(([, v]) => typeof v !== 'function')
      .map(([k]) => k)
      .sort()
    expect(dataKeys).toEqual([...PERSISTED_KEYS].sort())
  })

  it('resetProgress keeps the legacy measurement but clears its milestone flags', () => {
    useStore.setState({
      legacy: { wpm: 45, acc: 0.9, at: '2026-09-01T00:00:00.000Z', beatenAt: '2026-09-10', beatenSeen: true },
      lessons: { 'guia-tip-intro': { stars: 3, bestWpm: 10, bestAcc: 1, attempts: 1, completedAt: '2026-09-01T00:00:00.000Z' } },
    })

    useStore.getState().resetProgress()

    const { legacy, lessons } = useStore.getState()
    expect(legacy).toEqual({ wpm: 45, acc: 0.9, at: '2026-09-01T00:00:00.000Z' })
    expect(lessons).toEqual({})
  })

  it('resetProgress keeps legacy null when there was no legacy measurement', () => {
    useStore.setState({ legacy: null })
    useStore.getState().resetProgress()
    expect(useStore.getState().legacy).toBeNull()
  })
})
