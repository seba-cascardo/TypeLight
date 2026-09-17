import { act, renderHook } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MAX_LATENCY, metrics } from '@/engine/typing'
import { useTypingSession } from './useTypingSession'

function setHidden(hidden: boolean) {
  Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
  document.dispatchEvent(new Event('visibilitychange'))
}

describe('useTypingSession', () => {
  afterEach(() => {
    setHidden(false)
    vi.restoreAllMocks()
  })

  it('does not count time while the tab is hidden and caps the latency across the pause', () => {
    let now = 1000
    vi.spyOn(performance, 'now').mockImplementation(() => now)
    const { result } = renderHook(() => useTypingSession('abc', { sound: false }))
    act(() => result.current.input('a'))
    now = 1200
    act(() => setHidden(true))
    now = 6200
    act(() => setHidden(false))
    now = 6400
    act(() => result.current.input('b'))
    expect(result.current.state.keystrokes[1].latency).toBe(MAX_LATENCY)
    // 200 ms before hiding + 200 ms after: the five hidden seconds are not typing time.
    expect(metrics(result.current.state).seconds).toBeCloseTo(0.4, 1)
  })
})
