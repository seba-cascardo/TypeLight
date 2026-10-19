import { act } from '@testing-library/react'
import { vi } from 'vitest'

/**
 * A hand-driven clock for the rAF games: `performance.now()` and the animation frames only move when the test
 * says so. `frame()` is one painted frame; `skip()` is time that passes with no frames at all, which is what
 * Chrome does with a hidden tab. The field gets a real size (jsdom has no layout and no ResizeObserver).
 */
export function fakeFrames({ width = 800, height = 420 } = {}) {
  let now = 1000
  let nextId = 1
  const pending = new Map<number, FrameRequestCallback>()
  vi.spyOn(performance, 'now').mockImplementation(() => now)
  vi.spyOn(window, 'requestAnimationFrame').mockImplementation((cb) => {
    pending.set(nextId, cb)
    return nextId++
  })
  vi.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    pending.delete(id)
  })
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(width)
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(height)
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  return {
    now: () => now,
    frame(ms = 16) {
      act(() => {
        now += ms
        const due = [...pending.values()]
        pending.clear()
        for (const cb of due) cb(now)
      })
    },
    skip(ms: number) {
      now += ms
    },
  }
}

/** `document.hidden` is read-only in the DOM: redefine it, then tell the page. */
export function setHidden(hidden: boolean) {
  act(() => {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden })
    document.dispatchEvent(new Event('visibilitychange'))
  })
}
