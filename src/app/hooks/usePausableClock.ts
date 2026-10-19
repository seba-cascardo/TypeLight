import { useCallback, useEffect, useRef, useState } from 'react'

export interface PausableClock {
  /** Game time, ms: the wall clock minus the time spent paused. Frozen while paused. */
  clock: () => number
  paused: boolean
  /** Same as `paused`, for event handlers that must not wait for a render. */
  isPaused: () => boolean
  pause: () => void
  resume: () => void
}

/**
 * The rAF games' clock. Like the session clock in useTypingSession, it doesn't run while you're away: while
 * `running`, hiding the tab or leaving the window pauses it, and only `resume()` (the player's Enter or click)
 * starts it again, so nothing falls on someone who just came back.
 */
export function usePausableClock(running: boolean): PausableClock {
  const pausedMs = useRef(0)
  const pausedFrom = useRef<number | null>(null)
  const [paused, setPaused] = useState(false)
  const clock = useCallback(() => (pausedFrom.current ?? performance.now()) - pausedMs.current, [])
  const isPaused = useCallback(() => pausedFrom.current !== null, [])
  const pause = useCallback(() => {
    if (pausedFrom.current !== null) return
    pausedFrom.current = performance.now()
    setPaused(true)
  }, [])
  const resume = useCallback(() => {
    if (pausedFrom.current === null) return
    pausedMs.current += performance.now() - pausedFrom.current
    pausedFrom.current = null
    setPaused(false)
  }, [])

  useEffect(() => {
    if (!running) return
    const onVisibility = () => {
      if (document.hidden) pause()
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('blur', pause)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('blur', pause)
    }
  }, [running, pause])

  return { clock, paused, isPaused, pause, resume }
}
