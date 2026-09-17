import { useCallback, useEffect, useRef, useState } from 'react'
import { createSession, endSession, isFinished, metrics, typeText, type Metrics, type TypingState } from '@/engine/typing'
import { chime, click, thud } from '../lib/sound'

interface Options {
  sound?: boolean
  /** Stop automatically after this many ms of typing. */
  timeLimitMs?: number
  onFinish?: (state: TypingState) => void
}

export interface TypingSession {
  state: TypingState
  live: Metrics
  elapsedMs: number
  finished: boolean
  restart: (target?: string) => void
  /** Feed characters from an input event. */
  input: (text: string) => void
}

export function useTypingSession(target: string, opts: Options = {}): TypingSession {
  const [state, setStateRaw] = useState<TypingState>(() => createSession(target))
  const stateRef = useRef(state)
  const setState = useCallback((next: TypingState | ((s: TypingState) => TypingState)) => {
    const value = typeof next === 'function' ? next(stateRef.current) : next
    stateRef.current = value
    setStateRaw(value)
  }, [])
  const [now, setNow] = useState<number | undefined>(undefined)
  const onFinish = useRef(opts.onFinish)
  useEffect(() => {
    onFinish.current = opts.onFinish
  }, [opts.onFinish])
  const sound = opts.sound ?? true
  const limit = opts.timeLimitMs

  // Session clock = wall clock minus the time the tab spent hidden: the Reto's minute doesn't run while you're away.
  const hiddenMs = useRef(0)
  const hiddenFrom = useRef<number | null>(null)
  const resumed = useRef(false)
  const clock = useCallback(() => (hiddenFrom.current ?? performance.now()) - hiddenMs.current, [])
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        if (hiddenFrom.current === null) hiddenFrom.current = performance.now()
      } else if (hiddenFrom.current !== null) {
        hiddenMs.current += performance.now() - hiddenFrom.current
        hiddenFrom.current = null
        resumed.current = true
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  useEffect(() => {
    setState(createSession(target))
  }, [target, setState])

  // Fire onFinish exactly once per session.
  const notified = useRef<TypingState | null>(null)
  useEffect(() => {
    if (isFinished(state) && notified.current !== state) {
      notified.current = state
      if (sound) chime()
      onFinish.current?.(state)
    }
  }, [state, sound])

  // Live clock while typing (for WPM and time limits).
  useEffect(() => {
    if (state.startedAt === null || isFinished(state)) return
    const id = window.setInterval(() => {
      const t = clock()
      setNow(t)
      if (limit !== undefined && state.startedAt !== null && t - state.startedAt >= limit) {
        setState((s) => endSession(s, t))
      }
    }, 200)
    return () => window.clearInterval(id)
  }, [state, limit, setState, clock])

  const input = useCallback(
    (text: string) => {
      if (!text) return
      const now = clock()
      const s = stateRef.current
      if (isFinished(s)) return
      const next = typeText(s, text, now, resumed.current)
      resumed.current = false
      if (sound) {
        if (next.lastWrong) thud()
        else click()
      }
      setState(next)
    },
    [sound, setState, clock],
  )

  const restart = useCallback(
    (t?: string) => {
      notified.current = null
      hiddenMs.current = 0
      resumed.current = false
      setState(createSession(t ?? target))
    },
    [target, setState],
  )

  const end = state.finishedAt ?? now ?? state.startedAt ?? 0
  const elapsedMs = state.startedAt === null ? 0 : Math.max(0, end - state.startedAt)
  return { state, live: metrics(state, now), elapsedMs, finished: isFinished(state), restart, input }
}
